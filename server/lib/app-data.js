const { getYarValue, setYarValue } = require('./session')
const { Color } = require('./console-colours')
const lodash = require('lodash')


function getAppData(request) {
    const session = getYarValue(request, 'appData')
    return lodash.cloneDeep(session)
}

function mergeAppData(request, data, path) {
    const existingAppData = getAppData(request)
    if (path) { validateAppData(existingAppData, path) }

    console.log(Color.FgCyan, 'session data before update ' + JSON.stringify(existingAppData, null, 4))//TODO Remove this

    const mergedAppData = lodash.merge(existingAppData, data)
    //const mergedAppData = { ...emptyAppData, ...existingAppData, ...data }

    setYarValue(request, 'appData', mergedAppData)
    console.log(Color.FgGreen, 'session data after update ' + JSON.stringify(mergedAppData, null, 4))//TODO Remove this

    return mergedAppData
}

function setAppData(request, data, path) {
    const existingAppData = getAppData(request)
    if (path) { validateAppData(existingAppData, path) }

    console.log(Color.FgCyan, 'session data before update ' + JSON.stringify(existingAppData, null, 4))//TODO Remove this

    setYarValue(request, 'appData', data)
    console.log(Color.FgGreen, 'session data after update ' + JSON.stringify(data, null, 4))//TODO Remove this
}

function clearAppData(request) {
    setYarValue(request, 'appData', null)
}

function validateAppData(appData, path) {
    const appFlow = getAppFlow(appData)
    if (!appFlow.includes(path)) {
        throw `Invalid navigation to ${path}`
    }
}

function getAppFlow(appData) {
    let appFlow = ['apply-cites-permit', 'permit-type']
    if (appData) {


        if (appData.permitType === 'other') { appFlow.push('cannot-use-service') }

        if (appData.permitType && appData.permitType !== 'other') {
            appFlow.push('applying-on-behalf')

            if (appData.isAgent === true) {
                appFlow.push('contact-details/agent')
                if (appData.agent?.fullName) {
                    appFlow.push('postcode/agent')
                    appFlow.push('enter-address/agent')
                    if (appData.agent.addressSearchData?.postcode) {
                        appFlow.push('select-address/agent')
                    }
                    if (appData.agent.address) {
                        appFlow.push('confirm-address/agent')
                    }
                }
            }

            if (appData.isAgent === false || (appData.isAgent === true && appData.agent?.address)) {
                appFlow.push('contact-details/applicant')
                if (appData.applicant?.fullName) {
                    appFlow.push('postcode/applicant')
                    appFlow.push('enter-address/applicant')
                    if (appData.applicant?.addressSearchData?.postcode) {
                        appFlow.push('select-address/applicant')
                    }
                    if (appData.applicant?.address) {
                        appFlow.push('confirm-address/applicant')
                    }
                }
            }

            if (appData.applicant?.address) {
                appFlow.push('select-delivery-address')
                appFlow.push('postcode/delivery')
                appFlow.push('enter-address/delivery')
                if (appData.delivery?.addressSearchData?.postcode) {
                    appFlow.push('select-address/delivery')
                }
                if (appData.delivery?.address) {
                    appFlow.push('confirm-address/delivery')
                    appFlow.push('species-name/0')
                }
            }

            if (appData.applications?.length > 0) {
                appData.applications.forEach((application, applicationIndex) => {
                    if (applicationIndex > 0) {
                        appFlow.push(`species-name/${applicationIndex}`)
                    }
                    if (application.species?.speciesName) {
                        appFlow.push(`source-code/${applicationIndex}`)
                        const species = application.species

                        if (species.sourceCode) {
                            appFlow.push(`purpose-code/${applicationIndex}`)
                            if (species.purposeCode) {
                                if (appData.permitType === "article10") {
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
                                if (appData.permitType === "article10") {
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
    setAppData,
    mergeAppData,
    getAppData,
    clearAppData,
    validateAppData
}
