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

    console.log(Color.FgCyan, 'session data before update ' + JSON.stringify(existingSubmission, null, 4))//TODO Remove this

    const mergedSubmission = lodash.merge(existingSubmission, data)
    //const mergedSubmission = { ...emptySubmission, ...existingSubmission, ...data }

    setYarValue(request, 'submission', mergedSubmission)
    console.log(Color.FgGreen, 'session data after update ' + JSON.stringify(mergedSubmission, null, 4))//TODO Remove this

    return mergedSubmission
}

function setSubmission(request, data, path) {
    const existingSubmission = getSubmission(request)
    if (path) { validateSubmission(existingSubmission, path) }

    console.log(Color.FgCyan, 'session data before update ' + JSON.stringify(existingSubmission, null, 4))//TODO Remove this

    setYarValue(request, 'submission', data)
    console.log(Color.FgGreen, 'session data after update ' + JSON.stringify(data, null, 4))//TODO Remove this
}

function clearSubmission(request) {
    setYarValue(request, 'submission', null)
}

function validateSubmission(submission, path) {
    const appFlow = getAppFlow(submission)
    if (!appFlow.includes(path)) {
        throw `Invalid navigation to ${path}`
    }
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
                    if (submission.agent.addressSearchData?.postcode) {
                        appFlow.push('select-address/agent')
                    }
                    if (submission.agent.address) {
                        appFlow.push('confirm-address/agent')
                    }
                }
            }

            if (submission.isAgent === false || (submission.isAgent === true && submission.agent?.address)) {
                appFlow.push('contact-details/applicant')
                if (submission.applicant?.fullName) {
                    appFlow.push('postcode/applicant')
                    appFlow.push('enter-address/applicant')
                    if (submission.applicant?.addressSearchData?.postcode) {
                        appFlow.push('select-address/applicant')
                    }
                    if (submission.applicant?.address) {
                        appFlow.push('confirm-address/applicant')
                    }
                }
            }

            if (submission.applicant?.address) {
                appFlow.push('select-delivery-address')
                appFlow.push('postcode/delivery')
                appFlow.push('enter-address/delivery')
                if (submission.delivery?.addressSearchData?.postcode) {
                    appFlow.push('select-address/delivery')
                }
                if (submission.delivery?.address) {
                    appFlow.push('confirm-address/delivery')
                    appFlow.push('species-name/0')
                }
            }

            if (submission.applications?.length > 0) {
                submission.applications.forEach((application, applicationIndex) => {
                    if (applicationIndex > 0) {
                        appFlow.push(`species-name/${applicationIndex}`)
                    }
                    if (application.species?.speciesName) {
                        appFlow.push(`source-code/${applicationIndex}`)
                        const species = application.species

                        if (species.sourceCode) {
                            appFlow.push(`purpose-code/${applicationIndex}`)
                            if (species.purposeCode) {
                                if (submission.permitType === "article10") {
                                    appFlow.push(`use-certificate-for/${applicationIndex}`)
                                    if (species.useCertificateFor) {
                                        appFlow.push(`specimen-type/${applicationIndex}`)
                                    }
                                } else {
                                    appFlow.push(`specimen-type/${applicationIndex}`)
                                }
                            }
                            if (species.specimenType) {
                                if (species.specimenType === 'animalWorked' || species.specimenType === 'plantWorked') {
                                    appFlow.push(`created-date/${applicationIndex}`)
                                } else {
                                    appFlow.push(`trade-term-code/${applicationIndex}`)
                                }

                                if (species.createdDate) {
                                    appFlow.push(`trade-term-code/${applicationIndex}`)
                                }
                            }

                            if (species.isTradeTermCode === true || species.isTradeTermCode === false) {
                                appFlow.push(`unique-identification-mark/${applicationIndex}`)
                            }

                            if (species.uniqueIdentificationMarkType) {
                                if (species.specimenType === "animalLiving") {
                                    appFlow.push(`describe-living-animal/${applicationIndex}`)
                                } else {
                                    appFlow.push(`describe-specimen/${applicationIndex}`)
                                }
                            }
                            
                            if (species.specimenDescriptionGeneric || species.specimenDescriptionLivingAnimal) {
                                if (submission.permitType === "article10") {
                                    appFlow.push(`acquired-date/${applicationIndex}`)
                                } else {
                                    appFlow.push(`importer-exporter/${applicationIndex}`)

                                }
                            }
                        }
                    }
                })
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
    validateSubmission
}
