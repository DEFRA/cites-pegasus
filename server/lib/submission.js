const { getYarValue, setYarValue } = require('./session')
const { createContainer, checkContainerExists, saveObjectToContainer, checkFileExists, deleteFileFromContainer, getObjectFromContainer } = require('../services/blob-storage-service')
const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const { Color } = require('./console-colours')
const lodash = require('lodash')
const config = require('../../config/config')
const submissionFileName = 'submission.json'

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
    console.log(data)
}

function clearSubmission(request) {
    setYarValue(request, 'submission', null)
}

function validateSubmission(submission, path) {
    const { appFlow, applicationStatuses } = getAppFlow(submission)
    if (path) {
        if (!appFlow.includes(path)) {
            throw new Error(`Invalid navigation to ${path}`)
        }
    }
    return applicationStatuses
}

function getContainerName(request) {
    const cidmAuth = getYarValue(request, 'CIDMAuth')
    const uniqueId = cidmAuth.user.organisationId ? cidmAuth.user.organisationId : cidmAuth.user.contactId
    return `cites-draft-${uniqueId}`
}

async function checkDraftSubmissionExists(request) {
    if (!config.enableDraftSubmission) {
        return false
    }
    const containerName = getContainerName(request)
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
    const containerExists = await checkContainerExists(containerName)
    if (!containerExists) {
        await createContainer(containerName)
    }
    await saveObjectToContainer(containerName, submissionFileName, submission)
}

async function loadDraftSubmission(request) {
    try {
        const containerName = getContainerName(request)
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
    if (config.enableDeliveryType && !submission.delivery.deliveryType) {
        submission.delivery.deliveryType = 'standardDelivery'
    }

    submission.applications = [newApplication]
    setYarValue(request, 'submission', submission)
    setYarValue(request, 'cloneSource', cloneSource)
}

function createApplication(request) {
    const submission = getSubmission(request)
    const applications = submission.applications
    const newApplication = { applicationIndex: applications.length }
    applications.push(newApplication)
    setYarValue(request, 'submission', submission)
    return newApplication.applicationIndex
}

function cloneApplication(request, applicationIndex) {
    const submission = getSubmission(request)
    const applications = submission.applications
    const clonedApplication = { ...applications[applicationIndex], applicationIndex: applications.length }
    applications.push(clonedApplication)
    setYarValue(request, 'submission', submission)
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
        const { applicationStatuses } = getAppFlow(submission)
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

function getAppFlow(submission) {
    let applicationStatuses = []
    let appFlow = []
    if (submission) {
        if (submission.submissionRef) {
            appFlow.push('pay-application')
            if (submission.paymentDetails) {
                appFlow.push('application-complete')
                appFlow.push('govpay')
                appFlow.push('payment-problem')
            }
            if (submission.applications?.length > 0) {
                submission.applications.forEach((application, applicationIndex) => {
                    appFlow.push(`application-summary/view-submitted/${applicationIndex}`)
                })
            }
        } else {
            appFlow.push('permit-type')
            if(config.enableOtherPermitTypes && submission.permitTypeOption === pto.other){
                appFlow.push('other-permit-type')
            }
            if (submission.otherPermitTypeOption === pto.other) { appFlow.push('cannot-use-service') }

            if (submission.permitType && submission.otherPermitTypeOption !== pto.other) {
                appFlow.push('guidance-completion')
                appFlow.push('applying-on-behalf')

                if (typeof submission.isAgent === 'boolean') {

                    appFlow.push('contact-details/applicant')
                    if (submission.applicant?.fullName) {
                        appFlow.push('postcode/applicant')
                        appFlow.push('enter-address/applicant')
                        if (submission.applicant?.candidateAddressData?.addressSearchData?.postcode) {
                            appFlow.push('select-address/applicant')
                        }
                        if (submission.applicant?.candidateAddressData?.selectedAddress) {
                            appFlow.push('confirm-address/applicant')
                        }
                    }

                } else {
                    return { appFlow, applicationStatuses }
                }

                if (submission.applicant?.address) {
                    appFlow.push('select-delivery-address')
                    appFlow.push('postcode/delivery')
                    appFlow.push('enter-address/delivery')
                    if (submission.delivery?.candidateAddressData?.addressSearchData?.postcode) {
                        appFlow.push('select-address/delivery')
                    }
                    if (submission.delivery?.candidateAddressData?.selectedAddress) {
                        appFlow.push('confirm-address/delivery')
                    }
                } else {
                    return { appFlow, applicationStatuses }
                }

                if (submission.delivery?.address) {
                    if (config.enableDeliveryType) {
                        appFlow.push('delivery-type')
                        if (submission.delivery?.deliveryType) {
                            appFlow.push('species-name/0')
                        }
                    }
                    else {
                        appFlow.push('species-name/0')
                    }
                } else {
                    return { appFlow, applicationStatuses }
                }
                let completeApplications = 0
                if (submission.applications?.length > 0) {
                    submission.applications.forEach((application, applicationIndex) => {
                        applicationStatuses.push({ applicationIndex: applicationIndex, status: 'in-progress' })
                        if (applicationIndex > 0) {
                            appFlow.push(`species-name/${applicationIndex}`)
                        }

                        if (application.species?.speciesName) {
                            appFlow.push(`source-code/${applicationIndex}`)
                            if (application.species.hasRestriction) {
                                appFlow.push(`species-warning/${applicationIndex}`)
                            }
                        } else {
                            return { appFlow, applicationStatuses }
                        }

                        const species = application.species
                        if (species.sourceCode) {
                            if (submission.permitType === pt.article10) {
                                appFlow.push(`specimen-origin/${applicationIndex}`)
                                if (species.specimenOrigin) {
                                    appFlow.push(`use-certificate-for/${applicationIndex}`)
                                }
                            } else {
                                appFlow.push(`purpose-code/${applicationIndex}`)
                            }
                        } else {
                            return { appFlow, applicationStatuses }
                        }

                        if (species.purposeCode || species.useCertificateFor) {
                            appFlow.push(`specimen-type/${applicationIndex}`)
                        } else {
                            return { appFlow, applicationStatuses }
                        }

                        if (species.specimenType) {
                            if (species.specimenType === 'animalLiving') {//Living animal flow
                                appFlow.push(`unique-identification-mark/${applicationIndex}`)

                                if (species.uniqueIdentificationMarkType) {
                                    if (species.uniqueIdentificationMarkType === 'unmarked') {
                                        appFlow.push(`unmarked-specimens/${applicationIndex}`)
                                        if (species.numberOfUnmarkedSpecimens) {
                                            appFlow.push(`describe-specimen/${applicationIndex}`)
                                        } else {
                                            return { appFlow, applicationStatuses }
                                        }
                                    } else {
                                        appFlow.push(`describe-living-animal/${applicationIndex}`)
                                    }
                                } else {
                                    return { appFlow, applicationStatuses }
                                }


                            } else {//Not living animal flow
                                appFlow.push(`quantity/${applicationIndex}`)

                                if (species.quantity) {
                                    if (species.specimenType === 'animalWorked' || species.specimenType === 'plantWorked') {
                                        appFlow.push(`created-date/${applicationIndex}`)
                                        if (species.createdDate) {
                                            appFlow.push(`trade-term-code/${applicationIndex}`)
                                        } else {
                                            return { appFlow, applicationStatuses }
                                        }
                                    } else {
                                        appFlow.push(`trade-term-code/${applicationIndex}`)
                                    }
                                } else {
                                    return { appFlow, applicationStatuses }
                                }


                                if (species.isTradeTermCode === true || species.isTradeTermCode === false) {
                                    appFlow.push(`unique-identification-mark/${applicationIndex}`)
                                } else {
                                    return { appFlow, applicationStatuses }
                                }

                                if (species.uniqueIdentificationMarkType) {
                                    appFlow.push(`describe-specimen/${applicationIndex}`)
                                } else {
                                    return { appFlow, applicationStatuses }
                                }
                            }
                        } else {
                            return { appFlow, applicationStatuses }
                        }

                        if (species.specimenDescriptionGeneric || species.sex) {
                            if (submission.permitType === pt.article10) { //Article 10 flow
                                appFlow.push(`acquired-date/${applicationIndex}`)

                                if (species.acquiredDate) {
                                    appFlow.push(`already-have-a10/${applicationIndex}`)
                                } else {
                                    return { appFlow, applicationStatuses }
                                }
                                if (species.isA10CertificateNumberKnown === true || species.isA10CertificateNumberKnown === false) {
                                    appFlow.push(`ever-imported-exported/${applicationIndex}`)
                                } else {
                                    return { appFlow, applicationStatuses }
                                }

                            } else { //Not article 10 flow
                                appFlow.push(`importer-exporter/${applicationIndex}`)
                            }

                            if ((application.importerExporterDetails && submission.permitType !== pt.export) || species.isEverImportedExported === true || species.isEverImportedExported === false) {
                                appFlow.push(`permit-details/${applicationIndex}`)
                            }

                            if ((application.importerExporterDetails && submission.permitType === pt.export) || (!species.isEverImportedExported && submission.permitType === pt.article10) || application.permitDetails) {
                                appFlow.push(`additional-info/${applicationIndex}`)
                                appFlow.push(`application-summary/check/${applicationIndex}`)
                                appFlow.push(`application-summary/copy/${applicationIndex}`)
                                appFlow.push(`application-summary/view/${applicationIndex}`)
                                appFlow.push(`application-summary/copy-as-new/${applicationIndex}`)
                                appFlow.push(`application-summary/are-you-sure/check/${applicationIndex}`)
                                appFlow.push(`application-summary/are-you-sure/copy/${applicationIndex}`)
                                appFlow.push(`application-summary/are-you-sure/copy-as-new/${applicationIndex}`)
                                completeApplications++
                                applicationStatuses[applicationIndex].status = 'complete'
                            } else {
                                return { appFlow, applicationStatuses }
                            }
                        } else {
                            return { appFlow, applicationStatuses }
                        }
                    })

                    if (completeApplications > 0) {
                        appFlow.push(`your-submission`)
                        appFlow.push(`your-submission/are-you-sure/permit-type`)
                        appFlow.push(`your-submission/are-you-sure/remove`)
                        appFlow.push(`your-submission/create-application`)
                        appFlow.push(`add-application`)
                        appFlow.push('upload-supporting-documents')
                        appFlow.push('declaration')
                    }
                }
            }


        }
    }
    return { appFlow, applicationStatuses }
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
    reIndexApplications
}
