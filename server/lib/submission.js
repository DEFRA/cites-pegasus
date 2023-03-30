const { getYarValue, setYarValue } = require('./session')
const { Color } = require('./console-colours')
const lodash = require('lodash')


function getSubmission(request) {
    const session = getYarValue(request, 'submission')
    return lodash.cloneDeep(session)
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
    const appFlow = getAppFlow(submission)
    console.table(appFlow)
    if (!appFlow.includes(path)) {
        throw `Invalid navigation to ${path}`
    }
}

function cloneApplication(request, applicationIndex) {
    const submission = getSubmission(request)
    const applications= submission.applications
    const clonedApplication = {...applications[applicationIndex], applicationIndex: applications.length}
    applications.push(clonedApplication)
    setYarValue(request, 'submission', submission)
    return applications.length - 1
}

function deleteApplication(request, applicationIndex) {
    const submission = getSubmission(request)
    const applications = submission.applications
    applications.splice(applicationIndex, 1)
    setYarValue(request, 'submission', submission)
}

function getAppFlow(submission) {
    let appFlow = ['apply-cites-permit', 'permit-type']
    if (submission) {

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
                    } else {
                        return appFlow
                    }
                    if (submission.agent.candidateAddressData?.selectedAddress) {
                        appFlow.push('confirm-address/agent')
                    } else {
                        return appFlow
                    }
                } else {
                    return appFlow
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
                return appFlow
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
                return appFlow
            }

            if (submission.delivery?.address) {
                appFlow.push('species-name/0')
            } else {
                return appFlow
            }
            let completeApplications = 0
            if (submission.applications?.length > 0) {
                submission.applications.forEach((application, applicationIndex) => {
                    if (applicationIndex > 0) {
                        appFlow.push(`species-name/${applicationIndex}`)
                    }

                    if (application.species?.speciesName) {
                        appFlow.push(`source-code/${applicationIndex}`)
                    } else {
                        return appFlow
                    }
                    
                    const species = application.species
                    if (species.sourceCode) {
                        if (submission.permitType === "article10") {
                            appFlow.push(`use-certificate-for/${applicationIndex}`)
                        } else {
                            appFlow.push(`purpose-code/${applicationIndex}`)
                        }
                    } else {
                        return appFlow
                    }

                    if (species.purposeCode || species.useCertificateFor) {
                        appFlow.push(`specimen-type/${applicationIndex}`)
                    } else {
                        return appFlow
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
                                        return appFlow
                                    }
                                } else {
                                    appFlow.push(`describe-living-animal/${applicationIndex}`)
                                }
                            } else {
                                return appFlow
                            }


                        } else {//Not living animal flow
                            appFlow.push(`quantity/${applicationIndex}`)

                            if (species.quantity) {
                                if (species.specimenType === 'animalWorked' || species.specimenType === 'plantWorked') {
                                    appFlow.push(`created-date/${applicationIndex}`)
                                    if (species.createdDate) {
                                        appFlow.push(`trade-term-code/${applicationIndex}`)
                                    } else {
                                        return appFlow
                                    }
                                } else {
                                    appFlow.push(`trade-term-code/${applicationIndex}`)
                                }
                            } else {
                                return appFlow
                            }


                            if (species.isTradeTermCode === true || species.isTradeTermCode === false) {
                                appFlow.push(`unique-identification-mark/${applicationIndex}`)
                            } else {
                                return appFlow
                            }

                            if (species.uniqueIdentificationMarkType) {
                                appFlow.push(`describe-specimen/${applicationIndex}`)
                            } else {
                                return appFlow
                            }
                        }
                    } else {
                        return appFlow
                    }

                    if (species.specimenDescriptionGeneric || species.sex) {
                        if (submission.permitType === 'article10') { //Article 10 flow
                            appFlow.push(`acquired-date/${applicationIndex}`)

                            if (species.acquiredDate) {
                                appFlow.push(`already-have-a10/${applicationIndex}`)
                            } else {
                                return appFlow
                            }
                            if (species.isA10CertificateNumberKnown === true || species.isA10CertificateNumberKnown === false) {
                                appFlow.push(`ever-imported-exported/${applicationIndex}`)
                            } else {
                                return appFlow
                            }

                        } else { //Not article 10 flow
                            appFlow.push(`importer-exporter/${applicationIndex}`)
                        }

                        if ((application.importerExporterDetails && submission.permitType !== 'export') || species.isEverImportedExported === true || species.isEverImportedExported === false) {
                            appFlow.push(`permit-details/${applicationIndex}`)
                        } else {
                            return appFlow
                        }

                        if ((application.importerExporterDetails && submission.permitType === 'export') || (!species.isEverImportedExported && submission.permitType === 'article10') || application.permitDetails) {
                            appFlow.push(`comments/${applicationIndex}`)
                            appFlow.push(`application-summary/check/${applicationIndex}`)
                            appFlow.push(`application-summary/are-you-sure/${applicationIndex}`)
                            appFlow.push(`application-summary/copy/${applicationIndex}`)
                            appFlow.push(`submit-applications`)
                            appFlow.push(`submit-applications/are-you-sure/permit-type`)
                            appFlow.push(`submit-applications/are-you-sure/remove/${applicationIndex}`)
                            
                            completeApplications++
                        } else {
                            return appFlow
                        }
                    } else {
                        return appFlow
                    }
                })
                
                if (completeApplications > 0 && completeApplications === submission.applications.length) {
                    appFlow.push(`submit-applications`)
                    appFlow.push('upload-supporting-documents')
                }
            }
        }
    }
    return appFlow
}

module.exports = {
    setSubmission,
    mergeSubmission,
    getSubmission,
    clearSubmission,
    validateSubmission,
    cloneApplication,
    deleteApplication,
    validateSubmission,
    cloneApplication,
    deleteApplication
}
