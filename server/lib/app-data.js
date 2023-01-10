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
    //console.table(appFlow)
    if (!appFlow.includes(path)) {
        throw `Invalid navigation to ${path}`
    }
}

function getAppFlow(appData) {
    let appFlow = ['apply-cites-permit', 'permit-type']
    if (appData?.permitType === 'other') { appFlow.push('cannot-use-service') }
    if (appData?.permitType && appData?.permitType !== 'other') {
        appFlow.push('applying-on-behalf')
        if (appData?.isAgent === true) {
            appFlow.push('contact-details/agent')
            if (appData?.agent?.fullName) {
                appFlow.push('postcode/agent')
                appFlow.push('enter-address/agent')
                if (appData?.agent?.addressSearchData?.postcode) {
                    appFlow.push('select-address/agent')
                }
                if (appData?.agent?.address) {
                    appFlow.push('confirm-address/agent')
                }
            }
        }
        if (appData?.isAgent === false || (appData?.isAgent === true && appData?.agent?.address)) {
            appFlow.push('contact-details/applicant')
            if (appData?.applicant?.fullName) {
                appFlow.push('postcode/applicant')
                appFlow.push('enter-address/applicant')
                if (appData?.applicant?.addressSearchData?.postcode) {
                    appFlow.push('select-address/applicant')
                }
                if (appData?.applicant?.address) {
                    appFlow.push('confirm-address/applicant')
                }
            }
        }
        if (appData?.applicant?.address) {
            appFlow.push('select-delivery-address')
            appFlow.push('postcode/delivery')
            appFlow.push('enter-address/delivery')
            if (appData?.delivery?.addressSearchData?.postcode) {
                appFlow.push('select-address/delivery')
            }
            if (appData?.delivery?.address) {
                appFlow.push('confirm-address/delivery')
            }
        }
        // if (appData?.delivery?.address) {
        //     appFlow.push("species-name/0")
        // }
        if (appData?.species?.length > 0) {
            appData.species.forEach((species, speciesindex) => {
                appFlow.push(`species-name/${speciesindex}`)
                if (species.speciesName) {
                    species.specimens.forEach((specimen, specimenindex) => {
                        appFlow.push(`source-code/${speciesindex}/${specimenindex}`)
                    })
                }
                if (species.specimens) {
                    species.specimens.forEach((specimen, specimenindex) => {
                        if (specimen.sourceCode) {
                            appFlow.push(`purpose-code/${speciesindex}/${specimenindex}`)
                        }
                        if (specimen.purposeCode){
                            if (appData.permitType === "article10") {
                                appFlow.push(`use-certificate-for/${speciesindex}/${specimenindex}`)
                                if(specimen.useCertificateFor){
                                    appFlow.push(`specimen-type/${speciesindex}/${specimenindex}`)    
                                }
                            } else {
                                appFlow.push(`specimen-type/${speciesindex}/${specimenindex}`)
                            }
                        }
                        if (specimen.purposeCode) {
                            appFlow.push(`trade-term-code/${speciesindex}/${specimenindex}`)
                        }
                    })
                }
            })
        }
        
        
        // if (appData?.species?.length > 0) {
        //     appData.species.forEach((species, speciesindex) => {
        //         species.specimens.forEach((specimen, specimenindex) => {
        //             if (specimen.sourceCode) {
        //                 appFlow.push(`purpose-code/${speciesindex}/${specimenindex}`)
        //             }
        //         })
        //     })
        // }
    }
    //console.log(appFlow)
    return appFlow
}

module.exports = {
    setAppData,
    mergeAppData,
    getAppData,
    clearAppData,
    validateAppData
}
