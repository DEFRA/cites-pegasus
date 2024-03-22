const { getYarValue, setYarValue } = require('./session')
const { createContainer, checkContainerExists, saveObjectToContainer, checkFileExists, deleteFileFromContainer, getObjectFromContainer } = require('../services/blob-storage-service')
const { deliveryType: dt } = require("../lib/constants")
const { permitType: pt, permitTypeOption: pto, permitSubType: pst, permitType } = require('../lib/permit-type-helper')
const { Color } = require('./console-colours')
const lodash = require('lodash')
const config = require('../../config/config')
const { describe } = require('@hapi/joi/lib/base')

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
    return await checkFileExists(containerName, submissionFileName)
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
    const containerExists = await checkContainerExists(containerName)
    if (!containerExists) {
        await createContainer(containerName)
    }
    await saveObjectToContainer(containerName, submissionFileName, submission)
}

async function loadDraftSubmission(request) {
    try {
        const containerName = getContainerName(request)
        const submissionFileName = getSubmissionFileName(request)
        const draftSubmission = await getObjectFromContainer(containerName, submissionFileName)
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
    await deleteFileFromContainer(containerName, submissionFileName)
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

    submission.applications.forEach(migrateApplicationToNewSchema)

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
        }
    }
}

function migrateApplicationToNewSchema(app) {

    if (app.species.specimenType === 'animalLiving' && typeof app.species.isMultipleSpecimens !== 'boolean') {
        app.species.isMultipleSpecimens = app.species.numberOfUnmarkedSpecimens > 1
        
    }
    
    if (app.species.numberOfUnmarkedSpecimens && typeof app.species.numberOfUnmarkedSpecimens === "string") {
        app.species.numberOfUnmarkedSpecimens = parseInt(app.species.numberOfUnmarkedSpecimens)
    }
    
    if (app.species.quantity && typeof app.species.quantity === "string") {
        app.species.quantity = parseInt(app.species.quantity)
    }

    if (app.species.uniqueIdentificationMarkType === 'unmarked') {
        app.species.uniqueIdentificationMark = null
    }

    if (app.permitDetails) {
        delete app.permitDetails.isCountryOfOriginNotApplicable
        delete app.permitDetails.isExportOrReexportNotApplicable
        if (app.permitDetails.countryOfOrigin) {
            app.permitDetails.isCountryOfOriginNotKnown = false
        }

        if (app.permitDetails.exportOrReexportCountry) {
            app.permitDetails.isExportOrReexportSameAsCountryOfOrigin = false
        }
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
    clonedApplication.species.uniqueIdentificationMark = null
    if (clonedApplication.species.uniqueIdentificationMarkType != 'unmarked') {
        clonedApplication.species.uniqueIdentificationMarkType = null
    }
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

function getPageProgess(pageUrl, applicationIndex = null, includePageData = null, pageData = null) {
    return includePageData ? { pageUrl, applicationIndex, pageData } : { pageUrl, applicationIndex }
}

function getApplicationIndex(submission, applicationStatuses) {
    //This function should be used as a last resort to get the applicationIndex when the applicationIndex is not available in the URL
    let applicationIndex = 0

    //Get the applicationStatus with the highest applicationIndex that is in-progress
    const appInProgressIndex = applicationStatuses.sort((a, b) => b.applicationIndex - a.applicationIndex).find(item => item.status === 'in-progress')

    if (appInProgressIndex) {
        applicationIndex = appInProgressIndex.applicationIndex
    } else if (applicationStatuses.length > 0) {
        applicationIndex = applicationStatuses.length - 1
    }
    return applicationIndex
}

function getSubmissionProgress(submission, includePageData) {

    let applicationStatuses = []
    let submissionProgress = []
    if (!submission) {
        return { submissionProgress, applicationStatuses }
    }
    if (submission.submissionRef) {
        submissionProgress.push(getPageProgess('pay-application'))
        if (submission.paymentDetails) {
            submissionProgress.push(getPageProgess('application-complete'))
            submissionProgress.push(getPageProgess('govpay'))
            submissionProgress.push(getPageProgess('payment-problem'))
        }
        if (submission.applications?.length > 0) {
            submission.applications.forEach((application, applicationIndex) => {
                submissionProgress.push(getPageProgess(`application-summary/view-submitted/${applicationIndex}`, applicationIndex))
            })
        }
    }
    //Non submitted application
    submissionProgress.push(getPageProgess('permit-type', null, includePageData, getPageDataSimple('permitTypeOption', submission.permitTypeOption)))

    if (submission.permitTypeOption === pto.OTHER) {
        submissionProgress.push(getPageProgess('other-permit-type', null, includePageData, getPageDataSimple('otherPermitTypeOption', submission.otherPermitTypeOption)))
    }

    if (submission.otherPermitTypeOption === pto.OTHER) {
        submissionProgress.push(getPageProgess('cannot-use-service'))
        return { submissionProgress, applicationStatuses }
    }

    if (!submission.permitType) {
        return { submissionProgress, applicationStatuses }
    }

    if (submission.permitType && submission.otherPermitTypeOption !== pto.OTHER) {
        submissionProgress.push(getPageProgess('guidance-completion'))
    }

    submissionProgress.push(getPageProgess('applying-on-behalf', null, includePageData, getPageDataSimple('isAgent', submission.isAgent)))

    if (typeof submission.isAgent !== 'boolean') {
        return { submissionProgress, applicationStatuses }
    }

    submissionProgress.push(getPageProgess('contact-details/applicant', null, includePageData, getPageDataContactDetails(submission.applicant)))

    if (!submission.applicant?.fullName) {
        return { submissionProgress, applicationStatuses }
    }

    submissionProgress.push(getPageProgess('postcode/applicant'))
    submissionProgress.push(getPageProgess('enter-address/applicant'))

    if (submission.applicant?.candidateAddressData?.addressSearchData?.postcode) {
        submissionProgress.push(getPageProgess('select-address/applicant'))
    }

    if (submission.applicant?.candidateAddressData?.selectedAddress) {
        submissionProgress.push(getPageProgess('confirm-address/applicant', null, includePageData, getPageDataSimple('applicant-address', submission.applicant?.address)))
    }


    if (!submission.applicant?.address) {
        return { submissionProgress, applicationStatuses }
    }

    submissionProgress.push(getPageProgess('select-delivery-address', null, includePageData, getPageDataSimple('delivery-address', submission.delivery?.address)))
    submissionProgress.push(getPageProgess('postcode/delivery'))
    submissionProgress.push(getPageProgess('enter-address/delivery'))

    if (submission.delivery?.candidateAddressData?.addressSearchData?.postcode) {
        submissionProgress.push(getPageProgess('select-address/delivery'))
    }

    if (submission.delivery?.candidateAddressData?.selectedAddress) {
        submissionProgress.push(getPageProgess('confirm-address/delivery', null, includePageData, getPageDataSimple('delivery-address', submission.delivery?.address)))
    }

    if (!submission.delivery?.address) {
        return { submissionProgress, applicationStatuses }
    }

    let initialApplication
    if (submission.applications?.length > 0) {
        initialApplication = submission.applications[0]
    }

    if (config.enableDeliveryType) {
        submissionProgress.push(getPageProgess('delivery-type', null, includePageData, getPageDataSimple('deliveryType', submission.delivery?.deliveryType)))

        if (submission.delivery?.deliveryType) {
            submissionProgress.push(getPageProgess('species-name/0', 0, includePageData, getPageDataSimple('speciesName', initialApplication?.species?.speciesName)))
        }
    } else {
        submissionProgress.push(getPageProgess('species-name/0', 0, includePageData, getPageDataSimple('speciesName', initialApplication?.species?.speciesName)))
    }

    if (submission.applications?.length === 0) {
        return { submissionProgress, applicationStatuses }
    }

    let completeApplications = 0

    submission.applications.forEach((application, applicationIndex) => {
        applicationStatuses.push({ applicationIndex: applicationIndex, status: 'in-progress' })

        submissionProgress.push(getPageProgess(`application-summary/check/${applicationIndex}`, applicationIndex))
        submissionProgress.push(getPageProgess(`application-summary/copy/${applicationIndex}`, applicationIndex))
        submissionProgress.push(getPageProgess(`application-summary/are-you-sure/check/${applicationIndex}`, applicationIndex))
        submissionProgress.push(getPageProgess(`application-summary/copy-as-new/${applicationIndex}`, applicationIndex))
        submissionProgress.push(getPageProgess(`application-summary/are-you-sure/copy-as-new/${applicationIndex}`, applicationIndex))
        submissionProgress.push(getPageProgess(`application-summary/are-you-sure/copy/${applicationIndex}`, applicationIndex))

        if (applicationIndex > 0) {
            submissionProgress.push(getPageProgess(`species-name/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('speciesName', application?.species?.speciesName)))
        }

        const species = application.species

        if (!species?.speciesName) {
            return { submissionProgress, applicationStatuses }
        }

        if (species.hasRestriction) {
            submissionProgress.push(getPageProgess(`species-warning/${applicationIndex}`, applicationIndex))
        }

        submissionProgress.push(getPageProgess(`source-code/${applicationIndex}`, applicationIndex, includePageData, getPageDataSourceCode(species)))

        if (!species.sourceCode) {
            return { submissionProgress, applicationStatuses }
        }

        if (submission.permitType === pt.ARTICLE_10) {
            submissionProgress.push(getPageProgess(`specimen-origin/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('specimenOrigin', species.specimenOrigin)))
            if (species.specimenOrigin) {
                submissionProgress.push(getPageProgess(`use-certificate-for/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('useCertificateFor', species.useCertificateFor)))
            }
        } else {
            submissionProgress.push(getPageProgess(`purpose-code/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('purposeCode', species.purposeCode)))
        }

        if (!species.purposeCode && !species.useCertificateFor) {
            return { submissionProgress, applicationStatuses }
        }

        submissionProgress.push(getPageProgess(`specimen-type/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('specimenType', species.specimenType)))

        if (!species.specimenType) {
            return { submissionProgress, applicationStatuses }
        }

        if (species.specimenType === 'animalLiving') {//Living animal flow
            if (submission.permitType !== permitType.ARTICLE_10) {
                submissionProgress.push(getPageProgess(`multiple-specimens/${applicationIndex}`, applicationIndex, includePageData, getPageDataMultipleSpecimens(species)))
                if (typeof species.isMultipleSpecimens !== 'boolean') {
                    return { submissionProgress, applicationStatuses }
                }
            }

            if (submission.permitType === permitType.ARTICLE_10 || species.numberOfUnmarkedSpecimens === 1 || species.isMultipleSpecimens === false) {
                submissionProgress.push(getPageProgess(`unique-identification-mark/${applicationIndex}`, applicationIndex, includePageData, getPageDataUniqueIdentificationMark(species)))
                if (!species.uniqueIdentificationMarkType) {
                    return { submissionProgress, applicationStatuses }
                }
            }

            if (species.isMultipleSpecimens && species.numberOfUnmarkedSpecimens > 1) {
                submissionProgress.push(getPageProgess(`describe-specimen/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('specimenDescriptionGeneric', species.specimenDescriptionGeneric)))
            } else {
                submissionProgress.push(getPageProgess(`describe-living-animal/${applicationIndex}`, applicationIndex, includePageData, getPageDataDescribeLivingAnimal(species)))
            }

        } else {//Not living animal flow
            submissionProgress.push(getPageProgess(`quantity/${applicationIndex}`, applicationIndex, includePageData, getPageDataQuantity(species)))

            if (!species.quantity) {
                return { submissionProgress, applicationStatuses }
            }

            if (species.specimenType === 'animalWorked' || species.specimenType === 'plantWorked') {
                submissionProgress.push(getPageProgess(`created-date/${applicationIndex}`, applicationIndex, includePageData, getPageDataCreatedDate(species?.createdDate)))
                if (!species.createdDate) {
                    return { submissionProgress, applicationStatuses }
                }
            }

            submissionProgress.push(getPageProgess(`trade-term-code/${applicationIndex}`, applicationIndex, includePageData, getPageDataTradeTermCode(species)))

            if (typeof species.isTradeTermCode !== 'boolean') {
                return { submissionProgress, applicationStatuses }
            }

            submissionProgress.push(getPageProgess(`unique-identification-mark/${applicationIndex}`, applicationIndex, includePageData, getPageDataUniqueIdentificationMark(species)))

            if (!species.uniqueIdentificationMarkType) {
                return { submissionProgress, applicationStatuses }
            }

            submissionProgress.push(getPageProgess(`describe-specimen/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('specimenDescriptionGeneric', species.specimenDescriptionGeneric)))

        }

        if (!species.specimenDescriptionGeneric && !species.sex) {
            return { submissionProgress, applicationStatuses }
        }

        if (submission.permitType === pt.ARTICLE_10) { //Article 10 flow

            if (config.enableBreederPage && application.species.specimenType === 'animalLiving') {
                submissionProgress.push(getPageProgess(`breeder/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('isBreeder', application.isBreeder)))

                if (typeof application.isBreeder !== 'boolean') {
                    return { submissionProgress, applicationStatuses }
                }

                if (application.isBreeder === false) {
                    submissionProgress.push(getPageProgess(`acquired-date/${applicationIndex}`, applicationIndex, includePageData, getPageDataAcquiredDate(species?.acquiredDate)))
                }
                if (!species.acquiredDate && application.isBreeder === false) {
                    return { submissionProgress, applicationStatuses }
                }
            } else {
                submissionProgress.push(getPageProgess(`acquired-date/${applicationIndex}`, applicationIndex, includePageData, getPageDataAcquiredDate(species?.acquiredDate)))

                if (!species.acquiredDate) {
                    return { submissionProgress, applicationStatuses }
                }
            }

            submissionProgress.push(getPageProgess(`already-have-a10/${applicationIndex}`, applicationIndex, includePageData, getPageDataA10CertificateNumber(species)))

            if (typeof species.isA10CertificateNumberKnown !== 'boolean') {
                return { submissionProgress, applicationStatuses }
            }

            submissionProgress.push(getPageProgess(`ever-imported-exported/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('isEverImportedExported', species.isEverImportedExported)))

        } else if (!(submission.permitType === pt.REEXPORT && submission.otherPermitTypeOption === pto.SEMI_COMPLETE)) {

            submissionProgress.push(getPageProgess(`importer-exporter/${applicationIndex}`, applicationIndex, includePageData, getPageDataImporterExporter(application.importerExporterDetails)))

        }

        if ((application.importerExporterDetails && submission.permitType !== pt.EXPORT)
            || (submission.permitType === pt.REEXPORT && submission.otherPermitTypeOption === pto.SEMI_COMPLETE)
            || species.isEverImportedExported === true
        ) {
            submissionProgress.push(getPageProgess(`permit-details/${applicationIndex}`, applicationIndex, includePageData, getPageDataPermitDetails(application.permitDetails)))
        }

        if ((!application.importerExporterDetails || submission.permitType !== pt.EXPORT)
            && (species.isEverImportedExported || submission.permitType !== pt.ARTICLE_10)
            && !application.permitDetails) {
            return { submissionProgress, applicationStatuses }
        }

        submissionProgress.push(getPageProgess(`additional-info/${applicationIndex}`, applicationIndex, includePageData, getPageDataAdditionalInfo(application)))
        submissionProgress.push(getPageProgess(`application-summary/view/${applicationIndex}`, applicationIndex))

        completeApplications++
        applicationStatuses[applicationIndex].status = 'complete'
    })

    if (completeApplications > 0 && !submission.submissionRef) {
        submissionProgress.push(getPageProgess(`your-submission`))
        submissionProgress.push(getPageProgess(`your-submission/are-you-sure/permit-type`))
        submissionProgress.push(getPageProgess(`your-submission/are-you-sure/remove`))
        submissionProgress.push(getPageProgess(`your-submission/create-application`))
        submissionProgress.push(getPageProgess(`add-application`))
        submissionProgress.push(getPageProgess('upload-supporting-documents'))
        submissionProgress.push(getPageProgess('declaration'))
    }

    return { submissionProgress, applicationStatuses }
}

function getPageDataSimple(fieldId, value) {

    let hasData = false
    if (typeof value === 'boolean') {
        hasData = true
    } else {
        hasData = Boolean(value)
    }

    return [
        {
            fieldId: fieldId,
            isMandatory: true,
            hasData
        }
    ]
}

function getPageDataContactDetails(contact) {
    return [
        {
            fieldId: 'applicant-fullName',
            isMandatory: true,
            hasData: Boolean(contact?.fullName)
        },
        {
            fieldId: 'applicant-businessName',
            isMandatory: false,
            hasData: Boolean(contact?.businessName)
        },
        {
            fieldId: 'applicant-email',
            isMandatory: false,
            hasData: Boolean(contact?.email)
        }
    ]
}

function getPageDataSourceCode(species) {
    return [
        {
            fieldId: 'sourceCode',
            isMandatory: true,
            hasData: Boolean(species?.sourceCode)
        },
        {
            fieldId: 'anotherSourceCodeForI',
            isMandatory: species?.sourceCode === 'I',
            hasData: Boolean(species?.anotherSourceCodeForI)
        },
        {
            fieldId: 'anotherSourceCodeForO',
            isMandatory: species?.sourceCode === 'O',
            hasData: Boolean(species?.anotherSourceCodeForO)
        },
        {
            fieldId: 'enterAReason',
            isMandatory: species?.sourceCode === 'U',
            hasData: Boolean(species?.enterAReason)
        }
    ]
}

function getPageDataMultipleSpecimens(species) {
    return [
        {
            fieldId: 'isMultipleSpecimens',
            isMandatory: true,
            hasData: typeof species?.isMultipleSpecimens === 'boolean'
        },
        {
            fieldId: 'numberOfSpecimens',
            isMandatory: species?.isMultipleSpecimens,
            hasData: Boolean(species?.numberOfUnmarkedSpecimens)
        }
    ]
}

function getPageDataUniqueIdentificationMark(species) {
    return [
        {
            fieldId: 'uniqueIdentificationMarkType',
            isMandatory: true,
            hasData: Boolean(species?.uniqueIdentificationMarkType)
        },
        {
            fieldId: 'uniqueIdentificationMark',
            isMandatory: Boolean(species?.uniqueIdentificationMarkType) && species?.uniqueIdentificationMarkType !== 'unmarked',
            hasData: Boolean(species?.uniqueIdentificationMark)
        }
    ]
}

function getPageDataDescribeLivingAnimal(species) {
    return [
        {
            fieldId: 'sex',
            isMandatory: true,
            hasData: Boolean(species.sex)
        },
        {
            fieldId: 'dateOfBirth',
            isMandatory: false,
            hasData: Boolean(species.dateOfBirth)
        },
        {
            fieldId: 'maleParentDetails',
            isMandatory: false,
            hasData: Boolean(species.maleParentDetails)
        },
        {
            fieldId: 'femaleParentDetails',
            isMandatory: false,
            hasData: Boolean(species.femaleParentDetails)
        },
        {
            fieldId: 'specimenDescriptionLivingAnimal',
            isMandatory: true,
            hasData: Boolean(species.specimenDescriptionLivingAnimal)
        }
    ]
}

function getPageDataA10CertificateNumber(species) {
    return [
        {
            fieldId: 'isA10CertificateNumberKnown',
            isMandatory: true,
            hasData: typeof species.isA10CertificateNumberKnown === 'boolean'
        },
        {
            fieldId: 'a10CertificateNumber',
            isMandatory: Boolean(species.isA10CertificateNumberKnown),
            hasData: Boolean(species.a10CertificateNumber)
        }
    ]
}

function getPageDataImporterExporter(importerExporterDetails) {
    return [
        {
            fieldId: 'importerExporter-country',
            isMandatory: true,
            hasData: Boolean(importerExporterDetails?.country)
        },
        {
            fieldId: 'importerExporter-name',
            isMandatory: true,
            hasData: Boolean(importerExporterDetails?.name)
        },
        {
            fieldId: 'importerExporter-addressLine1',
            isMandatory: true,
            hasData: Boolean(importerExporterDetails?.addressLine1)
        },
        {
            fieldId: 'importerExporter-addressLine2',
            isMandatory: true,
            hasData: Boolean(importerExporterDetails?.addressLine2)
        },
        {
            fieldId: 'importerExporter-addressLine3',
            isMandatory: false,
            hasData: Boolean(importerExporterDetails?.addressLine3)
        },
        {
            fieldId: 'importerExporter-addressLine4',
            isMandatory: false,
            hasData: Boolean(importerExporterDetails?.addressLine4)
        },
        {
            fieldId: 'importerExporter-postcode',
            isMandatory: false,
            hasData: Boolean(importerExporterDetails?.postcode)
        },
    ]
}

function getPageDataPermitDetails(permitDetails) {
    return [
        {
            fieldId: 'isCountryOfOriginNotKnown',
            isMandatory: true,
            hasData: typeof permitDetails?.isCountryOfOriginNotKnown === 'boolean'
        },
        {
            fieldId: 'countryOfOrigin',
            isMandatory: !Boolean(permitDetails?.isCountryOfOriginNotKnown),
            hasData: Boolean(permitDetails?.countryOfOrigin)
        },
        {
            fieldId: 'countryOfOriginPermitNumber',
            isMandatory: !Boolean(permitDetails?.isCountryOfOriginNotKnown),
            hasData: Boolean(permitDetails?.countryOfOriginPermitNumber)
        },
        {
            fieldId: 'countryOfOriginPermitIssueDate',
            isMandatory: !Boolean(permitDetails?.isCountryOfOriginNotKnown),
            hasData: Boolean(permitDetails?.countryOfOriginPermitIssueDate?.year)
        },

        {
            fieldId: 'isExportOrReexportNotApplicable',
            isMandatory: true,
            hasData: typeof permitDetails?.isExportOrReexportSameAsCountryOfOrigin === 'boolean'
        },
        {
            fieldId: 'exportOrReexportCountry',
            isMandatory: !Boolean(permitDetails?.isExportOrReexportSameAsCountryOfOrigin),
            hasData: Boolean(permitDetails?.exportOrReexportCountry)
        },
        {
            fieldId: 'exportOrReexportPermitNumber',
            isMandatory: !Boolean(permitDetails?.isExportOrReexportSameAsCountryOfOrigin),
            hasData: Boolean(permitDetails?.exportOrReexportPermitNumber)
        },
        {
            fieldId: 'exportOrReexportPermitIssueDate',
            isMandatory: !Boolean(permitDetails?.isExportOrReexportSameAsCountryOfOrigin),
            hasData: Boolean(permitDetails?.exportOrReexportPermitIssueDate?.year)
        }
    ]
}

function getPageDataQuantity(species) {
    return [
        {
            fieldId: 'quantity',
            isMandatory: true,
            hasData: Boolean(species?.quantity)
        },
        {
            fieldId: 'unitOfMeasurement',
            isMandatory: true,
            hasData: Boolean(species?.unitOfMeasurement)
        }
    ]
}

function getPageDataCreatedDate(createdDate) {
    return [
        {
            fieldId: 'createdDate-isExactDateUnknown',
            isMandatory: true,
            hasData: typeof createdDate?.isExactDateUnknown === 'boolean'
        },
        {
            fieldId: 'createdDate-approximateDate',
            isMandatory: createdDate?.isExactDateUnknown,
            hasData: Boolean(createdDate?.approximateDate)
        },
        {
            fieldId: 'createdDate-date',
            isMandatory: !createdDate?.isExactDateUnknown,
            hasData: Boolean(createdDate?.day) && Boolean(createdDate?.month) && Boolean(createdDate?.year)
        }
    ]
}

function getPageDataAcquiredDate(acquiredDate) {
    return [
        {
            fieldId: 'acquiredDate-isExactDateUnknown',
            isMandatory: true,
            hasData: typeof acquiredDate?.isExactDateUnknown === 'boolean'
        },
        {
            fieldId: 'acquiredDate-approximateDate',
            isMandatory: acquiredDate?.isExactDateUnknown,
            hasData: Boolean(acquiredDate?.approximateDate)
        },
        {
            fieldId: 'acquiredDate-date',
            isMandatory: !acquiredDate?.isExactDateUnknown,
            hasData: Boolean(acquiredDate?.day) && Boolean(acquiredDate?.month) && Boolean(acquiredDate?.year)
        }
    ]
}

function getPageDataTradeTermCode(species) {
    return [
        {
            fieldId: 'isTradeTermCode',
            isMandatory: true,
            hasData: typeof species?.isTradeTermCode === 'boolean'
        },
        {
            fieldId: 'tradeTermCode',
            isMandatory: species?.isTradeTermCode,
            hasData: Boolean(species?.tradeTermCode)
        }
    ]
}

function getPageDataAdditionalInfo(application) {
    return [
        {
            fieldId: 'comments',
            isMandatory: false,
            hasData: Boolean(application?.comments)
        },
        {
            fieldId: 'internalReference',
            isMandatory: false,
            hasData: Boolean(application?.internalReference)
        }
    ]
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
    checkDraftSubmissionExists,
    deleteDraftSubmission,
    loadDraftSubmission,
    moveApplicationToEndOfList,
    reIndexApplications,
    allowPageNavigation
}

