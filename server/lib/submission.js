const { getYarValue, setYarValue } = require('./session')
const { createContainer, checkContainerExists, saveObjectToContainer, checkFileExists, deleteFileFromContainer, getObjectFromContainer } = require('../services/blob-storage-service')
const { deliveryType: dt } = require("../lib/constants")
const { permitType: pt, permitTypeOption: pto, permitSubType: pst, permitType } = require('../lib/permit-type-helper')
const { deleteIfExists } = require("../lib/helper-functions")
const { Color } = require('./console-colours')
const lodash = require('lodash')
const config = require('../../config/config')
const { describe } = require('@hapi/joi/lib/base')
const { getSubmissionProgress } = require('./submission-progress')

function getSubmission(request) {
    const session = getYarValue(request, 'submission')
    return lodash.cloneDeep(session)
}

function createSubmission(request) {
    const cidmAuth = getYarValue(request, 'CIDMAuth')
    const submission = {
        contactId: request.auth.credentials.contactId,
        organisationId: cidmAuth.user.organisationId || null,
        applications: [{ applicationIndex: 0 }]
    }
    setYarValue(request, 'submission', submission)
    return submission
}

function mergeSubmission(request, data, path) {
    const existingSubmission = getSubmission(request)
    if (path) { validateSubmission(existingSubmission, path) }

    const mergedSubmission = lodash.merge(existingSubmission, data)

    setYarValue(request, 'submission', mergedSubmission)

    return mergedSubmission
}

function setSubmission(request, data, path) {
    const existingSubmission = getSubmission(request)
    if (path) { validateSubmission(existingSubmission, path) }

    setYarValue(request, 'submission', data)
}

function clearSubmission(request) {
    setYarValue(request, 'submission', null)
}

function validateSubmission(submission, path, includePageData = false) {
    const { submissionProgress, applicationStatuses } = getSubmissionProgress(submission, includePageData)

    if (path) {
        if (!submissionProgress.map(item => item.pageUrl).includes(path)) {
            console.error('Path validation failed for ' + path)
            console.log('Submission: ' + JSON.stringify(submission))
            console.log('Submission Progress: ' + JSON.stringify(submissionProgress))
            console.log('Application Statuses: ' + JSON.stringify(applicationStatuses))
            throw new Error(`Invalid navigation to ${path}`)
        }
    }

    return { applicationStatuses, submissionProgress }

}

function allowPageNavigation(submissionProgress, path) {
    return submissionProgress.map(item => item.pageUrl).includes(path)
}

function getContainerName(request) {
    const cidmAuth = getYarValue(request, 'CIDMAuth')
    const uniqueId = cidmAuth.user.contactId
    return `cites-draft-${uniqueId}`
}

function getSubmissionFileName(request) {
    const cidmAuth = getYarValue(request, 'CIDMAuth')
    const fileName = cidmAuth.user.organisationId ? `submission-${cidmAuth.user.organisationId}.json` : `submission.json`
    return fileName
}

async function checkDraftSubmissionExists(request) {
    if (!config.enableDraftSubmission) {
        return false
    }
    const containerName = getContainerName(request)
    const submissionFileName = getSubmissionFileName(request)
    return await checkFileExists(request.server, containerName, submissionFileName)
}

async function getDraftSubmissionDetails(request) {
    if (!config.enableDraftSubmission) {
        return false
    }

    const draftSubmissionDetail = { draftExists: false }
    const containerName = getContainerName(request)
    const submissionFileName = getSubmissionFileName(request)
    draftSubmissionDetail.draftExists = await checkFileExists(request.server, containerName, submissionFileName)

    if (draftSubmissionDetail.draftExists) {
        const draftSubmission = await getObjectFromContainer(request.server, containerName, submissionFileName)
        if (draftSubmission.a10SourceSubmissionRef) {
            draftSubmissionDetail.a10SourceSubmissionRef = draftSubmission.a10SourceSubmissionRef
        }
    }

    return draftSubmissionDetail
}

async function saveDraftSubmission(request, savePointUrl) {
    if (!config.enableDraftSubmission) {
        return
    }

    const submission = getSubmission(request)
    submission.savePointUrl = savePointUrl
    submission.savePointDate = new Date()
    const containerName = getContainerName(request)
    const submissionFileName = getSubmissionFileName(request)
    const containerExists = await checkContainerExists(request.server, containerName)
    if (!containerExists) {
        await createContainer(request.server, containerName)
    }
    await saveObjectToContainer(request.server, containerName, submissionFileName, submission)
}

async function saveGeneratedDraftSubmission(request, savePointUrl, submission) {
    if (!config.enableDraftSubmission) {
        return
    }

    submission.savePointUrl = savePointUrl
    submission.savePointDate = new Date()
    const containerName = getContainerName(request)
    const submissionFileName = getSubmissionFileName(request)
    const containerExists = await checkContainerExists(request.server, containerName)
    if (!containerExists) {
        await createContainer(request.server, containerName)
    }
    await saveObjectToContainer(request.server, containerName, submissionFileName, submission)
}

async function loadDraftSubmission(request) {
    try {
        const containerName = getContainerName(request)
        const submissionFileName = getSubmissionFileName(request)
        const draftSubmission = await getObjectFromContainer(request.server, containerName, submissionFileName)
        setSubmission(request, draftSubmission, null)
        return draftSubmission
    }
    catch (err) {
        console.log(err)
        throw err
    }
}

async function deleteDraftSubmission(request) {
    if (!config.enableDraftSubmission) {
        return
    }
    const containerName = getContainerName(request)
    const submissionFileName = getSubmissionFileName(request)
    await deleteFileFromContainer(request.server, containerName, submissionFileName)
}

function generateExportSubmissionFromA10(submission, submissionRef) {
    const exportSubmission = {
        a10SourceSubmissionRef: submissionRef,
        permitType: pt.EXPORT,
        permitTypeOption: pto.EXPORT,
        contactId: submission.contactId,
        organisationId: submission.organisationId,
        applications: [],
        isAgent: submission.isAgent,
        applicant: submission.applicant,
        delivery: submission.delivery
    }
    submission.applications.forEach(a10App => {
        if (a10App.a10ExportData.isExportPermitRequired) {
            exportSubmission.applications.push(generateExportApplicationFromA10(a10App))
        }
    })
    return exportSubmission
}

function generateExportApplicationFromA10(a10App) {
    const exportApp = lodash.cloneDeep(a10App)
    exportApp.species.purposeCode = exportApp.a10ExportData.purposeCode
    exportApp.importerExporterDetails = exportApp.a10ExportData.importerDetails
    exportApp.a10SourceApplicationIndex = exportApp.applicationIndex
    exportApp.species.isMultipleSpecimens = false
    exportApp.species.numberOfUnmarkedSpecimens = null

    deleteIfExists(exportApp, 'a10ExportData')
    deleteIfExists(exportApp, 'permitDetails')
    deleteIfExists(exportApp, 'permitSubType')
    deleteIfExists(exportApp.species, 'specimenOrigin')
    deleteIfExists(exportApp.species, 'useCertificateFor')
    deleteIfExists(exportApp.species, 'isA10CertificateNumberKnown')
    deleteIfExists(exportApp.species, 'a10CertificateNumber')
    deleteIfExists(exportApp.species, 'isEverImportedExported')
    deleteIfExists(exportApp.species, 'acquiredDate')
    deleteIfExists(exportApp, 'isBreeder')

    return exportApp
}

function cloneSubmission(request, applicationIndex) {
    const submission = getSubmission(request)
    const newApplication = submission.applications[applicationIndex]
    const cloneSource = { submissionRef: submission.submissionRef, applicationRef: newApplication.applicationRef, applicationIndex }

    delete submission.agent
    delete submission.submissionRef
    delete submission.submissionId
    delete submission.paymentDetails
    delete submission.supportingDocuments
    delete submission.submissionStatus
    delete submission.a10SourceSubmissionRef

    submission.applications.forEach(app => delete app.a10SourceApplicationIndex)

    newApplication.applicationIndex = 0
    delete newApplication.applicationRef
    submission.applications = [newApplication]

    migrateSubmissionToNewSchema(submission)

    setYarValue(request, 'submission', submission)
    setYarValue(request, 'cloneSource', cloneSource)
}

function migrateSubmissionToNewSchema(submission) {
    if (config.enableDeliveryType && !submission.delivery.deliveryType) {
        submission.delivery.deliveryType = dt.STANDARD_DELIVERY
    }

    submission.applications.forEach(application => migrateApplicationToNewSchema(application, submission.permitType))

    if (!submission.permitTypeOption) {
        switch (submission.permitType) {
            case "import":
                submission.permitTypeOption = 'import'
                break
            case "export":
                submission.permitTypeOption = 'export'
                break
            case "reexport":
                submission.permitTypeOption = 'reexport'
                break
            case "article10":
                submission.permitTypeOption = 'article10'
                break
            default:
                throw new Error(`Unable to migrate permit type: ${submission.permitType}`)
        }
    }
}

function migrateApplicationToNewSchema(app, permitType) {

    if (app.species.specimenType === 'animalLiving' && typeof app.species.isMultipleSpecimens !== 'boolean') {
        app.species.isMultipleSpecimens = app.species.numberOfUnmarkedSpecimens > 1
    }

    if (app.species.numberOfUnmarkedSpecimens && typeof app.species.numberOfUnmarkedSpecimens === "string") {
        app.species.numberOfUnmarkedSpecimens = parseInt(app.species.numberOfUnmarkedSpecimens)
    }

    if (app.species.uniqueIdentificationMarkType) {
        if (app.species.uniqueIdentificationMarkType === 'unmarked') {
            app.species.hasUniqueIdentificationMark = false
            app.species.uniqueIdentificationMarks = null
        } else {
            app.species.hasUniqueIdentificationMark = true
            app.species.uniqueIdentificationMarks = [{
                index: 0,
                uniqueIdentificationMark: app.species.uniqueIdentificationMark,
                uniqueIdentificationMarkType: app.species.uniqueIdentificationMarkType
            }]
        }
        delete app.species.uniqueIdentificationMark
        delete app.species.uniqueIdentificationMarkType
    }

    if (app.permitDetails) {
        deleteIfExists(app.permitDetails, 'isCountryOfOriginNotApplicable')
        deleteIfExists(app.permitDetails, 'isExportOrReexportNotApplicable')

        if (app.permitDetails.countryOfOrigin) {
            app.permitDetails.isCountryOfOriginNotKnown = false
        }

        if (app.permitDetails.exportOrReexportCountry) {
            app.permitDetails.isExportOrReexportSameAsCountryOfOrigin = false
            app.permitDetails.exportOrReexportPermitDetailsNotKnown = false
        }

        if (permitType !== pt.IMPORT) {
            deleteIfExists(app.permitDetails, 'isExportOrReexportSameAsCountryOfOrigin')
        }

        if (permitType === pt.ARTICLE_10) {
            deleteIfExists(app.permitDetails, 'exportOrReexportCountry')
            deleteIfExists(app.permitDetails, 'exportOrReexportCountryDesc')
            deleteIfExists(app.permitDetails, 'exportOrReexportPermitNumber')
            deleteIfExists(app.permitDetails, 'exportOrReexportPermitIssueDate')
            deleteIfExists(app.permitDetails, 'exportOrReexportPermitDetailsNotKnown')
        }
    }

    if (!config.enableNotKnownTradeTermCode && !app.species.tradeTermCode) {
        app.species.tradeTermCode = null
        app.species.isTradeTermCode = null
        app.species.isTradeTermCodeDesc = null
    }
}

function createApplication(request) {
    const submission = getSubmission(request)
    const applications = submission.applications
    const newApplication = { applicationIndex: applications.length }

    if ([pst.DRAFT, pst.SEMI_COMPLETE].includes(applications[0].permitSubType)) {
        newApplication.permitSubType = applications[0].permitSubType
    }

    applications.push(newApplication)
    setYarValue(request, 'submission', submission)
    return newApplication.applicationIndex
}

function cloneApplication(request, applicationIndex) {
    deleteInProgressApplications(request)
    const submission = getSubmission(request)
    const applications = submission.applications
    const clonedApplication = lodash.cloneDeep(applications[applicationIndex])
    clonedApplication.applicationIndex = applications.length
    clonedApplication.species.uniqueIdentificationMarks = null
    applications.push(clonedApplication)
    mergeSubmission(request, { applications })
    return clonedApplication.applicationIndex
}

function deleteApplication(request, applicationIndex) {
    const submission = getSubmission(request)
    const applications = submission.applications
    applications.splice(applicationIndex, 1)

    // Update the applicationIndex of each remaining application to ensure no gaps
    reIndexApplications(applications)

    setYarValue(request, 'submission', submission)
    return submission
}

function reIndexApplications(applications) {
    applications.forEach((application, index) => {
        application.applicationIndex = index;
    })
}

function moveApplicationToEndOfList(applications, applicationIndex) {
    const application = applications[applicationIndex]
    applications.splice(applicationIndex, 1)
    applications.push(application)
}

function deleteInProgressApplications(request) {
    while (true) {
        const submission = getSubmission(request)
        const { applicationStatuses } = getSubmissionProgress(submission, false)
        if (!applicationStatuses.some(appStatus => appStatus.status === "in-progress")) {
            //All partial / in-progress applications have been removed
            break
        }

        //Remove any partial / in-progress applications
        for (const appStatus of applicationStatuses) {

            if (appStatus.status === "in-progress") {
                deleteApplication(request, appStatus.applicationIndex)
                //Only delete 1 at a time then refetch from session as the deleteApplication changes the indexes
                break
            }
        }
    }
}

function getCompletedApplications(submission, appStatuses) {
    return submission.applications.filter(app => {
        const status = appStatuses.find(status => status.applicationIndex === app.applicationIndex);
        return status && status.status === 'complete';
    });
}

function getApplicationIndex(submission, applicationStatuses) {
    //This function should be used as a last resort to get the applicationIndex when the applicationIndex is not available in the URL
    //Get the applicationStatus with the highest applicationIndex that is in-progress
    const appInProgressIndex = applicationStatuses.sort((a, b) => b.applicationIndex - a.applicationIndex).find(item => item.status === 'in-progress')

    if (appInProgressIndex) {
        return appInProgressIndex.applicationIndex
    } else if (applicationStatuses.length > 0) {
        return applicationStatuses.length - 1
    } else {
        return 0
    }
}

module.exports = {
    createSubmission,
    setSubmission,
    mergeSubmission,
    getSubmission,
    clearSubmission,
    cloneSubmission,
    createApplication,
    deleteApplication,
    deleteInProgressApplications,
    validateSubmission,
    cloneApplication,
    getCompletedApplications,
    getApplicationIndex,
    saveDraftSubmission,
    saveGeneratedDraftSubmission,
    checkDraftSubmissionExists,
    getDraftSubmissionDetails,
    deleteDraftSubmission,
    loadDraftSubmission,
    moveApplicationToEndOfList,
    reIndexApplications,
    allowPageNavigation,
    generateExportSubmissionFromA10
}

