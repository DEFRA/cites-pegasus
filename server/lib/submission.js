const { getYarValue, setYarValue } = require('./session')
const { Color } = require('./console-colours')
const lodash = require('lodash')


function getSubmission(request) {
    const session = getYarValue(request, 'submission')
    return lodash.cloneDeep(session)
}

function createSubmission(request) {
    const submission = { contactId: request.auth.credentials.contactId, applications: [{ applicationIndex: 0 }] }
    setYarValue(request, 'submission', submission)
    return submission
}

function mergeSubmission(request, data, path) {
    const existingSubmission = getSubmission(request)
    if (path) { validateSubmission(existingSubmission, path) }

    //console.log(Color.FgCyan, 'session data before update ' + JSON.stringify(existingSubmission, null, 4))//TODO Remove this

    const mergedSubmission = lodash.merge(existingSubmission, data)
    //const mergedSubmission = { ...emptySubmission, ...existingSubmission, ...data }

    setYarValue(request, 'submission', mergedSubmission)
    console.log(Color.FgGreen, 'session data after update ' + JSON.stringify(mergedSubmission, null, 4))//TODO Remove this

    return mergedSubmission
}

function setSubmission(request, data, path) {
    const existingSubmission = getSubmission(request)
    if (path) { validateSubmission(existingSubmission, path) }

    //console.log(Color.FgCyan, 'session data before update ' + JSON.stringify(existingSubmission, null, 4))//TODO Remove this

    setYarValue(request, 'submission', data)
    console.log(Color.FgGreen, 'session data after update ' + JSON.stringify(data, null, 4))//TODO Remove this
}

function clearSubmission(request) {
    setYarValue(request, 'submission', null)
}

function validateSubmission(submission, path) {
    const { appFlow, applicationStatuses } = getAppFlow(submission)
    //console.table(appFlow)
    //console.table(applicationStatuses)
    if (path) {
        if (!appFlow.includes(path)) {
            throw `Invalid navigation to ${path}`
        }
    }
    return applicationStatuses
}

function cloneSubmission(request, applicationIndex) {
    const submission = getSubmission(request)
    const newApplication = submission.applications[applicationIndex]
    const cloneSource = {submissionRef: submission.submissionRef, applicationIndex}

    if(submission.hasOwnProperty('submissionRef')) {
        delete submission.submissionRef
    }
    if(submission.hasOwnProperty('paymentDetails')) {
        delete submission.paymentDetails  
    }
    
    newApplication.applicationIndex = 0
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
    applications.forEach((application, index) => {
        application.applicationIndex = index;
    })
    setYarValue(request, 'submission', submission)
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
            appFlow.push('pay-application')//TODO May need some extra logic around payment status here
            appFlow.push('application-complete')
            if (submission.applications?.length > 0) {
                submission.applications.forEach((application, applicationIndex) => {
                    appFlow.push(`application-summary/view-submitted/${applicationIndex}`)
                })
            }
        } else {
            appFlow.push('permit-type')
            if (submission.permitType === 'other') { appFlow.push('cannot-use-service') }

            if (submission.permitType && submission.permitType !== 'other') {
                appFlow.push('applying-on-behalf')

                if (submission.isAgent === true) {
                    appFlow.push('contact-details/agent')
                    if (submission.agent?.fullName) {
                        appFlow.push('postcode/agent')
                        appFlow.push('enter-address/agent')
                        if (submission.agent.candidateAddressData?.addressSearchData?.postcode) {
                            appFlow.push('select-address/agent')
                        }
                        if (submission.agent.candidateAddressData?.selectedAddress) {
                            appFlow.push('confirm-address/agent')
                        }
                    } else {
                        return { appFlow, applicationStatuses }
                    }
                }

                if (submission.isAgent === false || (submission.isAgent === true && submission.agent?.address)) {
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
                    appFlow.push('species-name/0')
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
                        } else {
                            return { appFlow, applicationStatuses }
                        }

                        const species = application.species
                        if (species.sourceCode) {
                            if (submission.permitType === "article10") {
                                appFlow.push(`use-certificate-for/${applicationIndex}`)
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
                            if (submission.permitType === 'article10') { //Article 10 flow
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

                            if ((application.importerExporterDetails && submission.permitType !== 'export') || species.isEverImportedExported === true || species.isEverImportedExported === false) {
                                appFlow.push(`permit-details/${applicationIndex}`)
                            }

                            if ((application.importerExporterDetails && submission.permitType === 'export') || (!species.isEverImportedExported && submission.permitType === 'article10') || application.permitDetails) {
                                appFlow.push(`comments/${applicationIndex}`)
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
    validateSubmission,
    cloneSubmission,
    createApplication,
    cloneApplication,
    deleteApplication,
    validateSubmission,
    cloneApplication,
    deleteApplication,
    getCompletedApplications,
    getApplicationIndex
}
