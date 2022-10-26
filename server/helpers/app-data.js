const { getYarValue, setYarValue } = require('./session')
const lodash = require('lodash')

const emptyAppData = {
    permitType: null,
    isAgent: null,
    agent: null,
    applicant: null
}

function getAppData(request) {
    return getYarValue(request, 'appData') || emptyAppData
}

function setAppData(request, data, path) {
    const existingAppData = getAppData(request)
    if (path) {validateAppData(existingAppData, path)}
    
    console.dir(existingAppData)//TODO Remove this

    const mergedAppData = lodash.merge(emptyAppData, existingAppData, data)
    //const mergedAppData = { ...emptyAppData, ...existingAppData, ...data }
    
    setYarValue(request, 'appData', mergedAppData)
    console.dir(mergedAppData)//TODO Remove this
    return mergedAppData
}

function clearAppData(request) {
    setYarValue(request, 'appData', emptyAppData)
    console.log(emptyAppData)//TODO Remove this
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
    if (appData.permitType === 'other') { appFlow.push('cannot-use-service') }
    if (appData.permitType !== null && appData.permitType !== 'other') { 
        appFlow.push('agent')
        if (appData.isAgent === true) { 
            appFlow.push('contact-details/agent') 
            if (appData.agent?.fullName) {
                appFlow.push('postcode/agent')
            }
        }
        if (appData.isAgent === false) { // or end of agent flow is complete
            appFlow.push('contact-details/applicant') 
            if (appData.applicant?.fullName) {
                appFlow.push('postcode/applicant')
            }
        }
    }

    return appFlow
}

module.exports = {
    setAppData,
    getAppData,
    clearAppData,
    validateAppData
}
