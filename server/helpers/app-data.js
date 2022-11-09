const { getYarValue, setYarValue } = require('./session')
const { Color } = require('./console-colours')
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
    
    console.log(Color.FgCyan,'before: ' + JSON.stringify(existingAppData, null, 4))//TODO Remove this

    const mergedAppData = lodash.merge(emptyAppData, existingAppData, data)
    //const mergedAppData = { ...emptyAppData, ...existingAppData, ...data }
    
    setYarValue(request, 'appData', mergedAppData)
    console.log(Color.FgGreen, 'after: ' + JSON.stringify(mergedAppData, null, 4))//TODO Remove this
    
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
                appFlow.push('search-address/agent')
                appFlow.push('international-address/agent')
                if(appData.agent?.addressSearchData?.postcode
                || appData.agent?.addressSearchData?.property
                || appData.agent?.addressSearchData?.street
                || appData.agent?.addressSearchData?.town) {
                    appFlow.push('select-address/agent')
                }
            }
        }
        if (appData.isAgent === false || (appData.isAgent === true && appData.agent?.address)) {
            appFlow.push('contact-details/applicant') 
            if (appData.applicant?.fullName) {
                appFlow.push('postcode/applicant')
                appFlow.push('search-address/applicant')
                appFlow.push('international-address/applicant')
                if(appData.applicant?.addressSearchData?.postcode 
                || appData.applicant?.addressSearchData?.property
                || appData.applicant?.addressSearchData?.street
                || appData.applicant?.addressSearchData?.town) {
                    appFlow.push('select-address/applicant')
                }
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
