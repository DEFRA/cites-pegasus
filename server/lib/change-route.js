const urlPrefix = require("../../config/config").urlPrefix
const { setYarValue, getYarValue } = require("../lib/session")
const changeTypes = ['sourceCode']
const applicationSummaryCheckUrl = `${urlPrefix}/application-summary/check`

function clearChangeRoute(request) {
    setYarValue(request, "changeRouteData", null)
}

function setChangeRoute(request, changeType, applicationIndex) {
    let startUrl = ""
    let endUrl = ""
    let confirm = false

    switch (changeType) {
        case "sourceCode":
            startUrl = `${urlPrefix}/source-code/${applicationIndex}`
            confirm = true
            break
        case "agentContactDetails":
            startUrl = `${urlPrefix}/contactdetails/agent/`
            break
        default:
            throw new Error(`Invalid change type: ${changeType}`)
    }

    //CHANGE TYPES THAT NEED THE CONFIRMATION PAGE
    // Permit type
    // Your contact details - Full name
    // Your contact details - Address
    // Applicant's contact details - Full name
    // Applicant's contact details - Address
    // Delivery address
    // Scientific name

    if (!endUrl) {
        endUrl = startUrl
    }

    changeRouteData = { changeType: changeType, showConfirmationPage: confirm, startUrl: startUrl, endUrl: endUrl, applicationIndex: applicationIndex }

    setYarValue(request, "changeRouteData", changeRouteData)

    return changeRouteData
}

function checkChangeRouteExit(request, isBack = false) {
    const changeData = getYarValue(request, "changeRouteData")
    if (changeData) {
        if ((!isBack && request.headers.referer.endsWith(changeData.endUrl))
            || (isBack && request.path.endsWith(changeData.startUrl))) {
            return `${applicationSummaryCheckUrl}/${changeData.applicationIndex}`
        }
    }
    return null
}

module.exports = {
    checkChangeRouteExit,
    setChangeRoute,
    clearChangeRoute,
    changeTypes
}
