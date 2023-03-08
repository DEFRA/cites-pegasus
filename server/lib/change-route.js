const urlPrefix = require("../../config/config").urlPrefix
const { setYarValue, getYarValue } = require("../lib/session")
const changeTypes = ['sourceCode']
const applicationSummaryCheckUrl = `${urlPrefix}/application-summary/check`

function setChangeRoute(request, changeType, applicationIndex) {
    let startUrl = ""
    let endUrl = ""

    switch (changeType) {
      case "sourceCode":
        startUrl = `${urlPrefix}/source-code/${applicationIndex}`
        break;
      default: 
        throw new Error(`Invalid change type: ${changeType}`)
    }

    if (!endUrl) {
      endUrl = startUrl
    }

    changeRouteData = { applicationIndex: applicationIndex, changeType: changeType, startUrl: startUrl, endUrl: endUrl }

    setYarValue(request, "changeRouteData", changeRouteData)

    return changeRouteData
}

function checkChangeRouteExit(request) {
    const changeData = getYarValue(request, "change-data")
    if (changeData && request.headers.referer.endsWith(changeData.endUrl)) {
        return h.redirect(`${applicationSummaryCheckUrl}/${changeData.applicationIndex}`)
    } else {
        return null
    }
}

module.exports = {
    checkChangeRouteExit,
    setChangeRoute,
    changeTypes
}
