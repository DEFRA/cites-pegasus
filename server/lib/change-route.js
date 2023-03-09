const urlPrefix = require("../../config/config").urlPrefix
const { setYarValue, getYarValue } = require("../lib/session")
const changeTypes = ['sourceCode', 'applicantContactDetails', 'agentContactDetails', 'applicantAddress', 'agentAddress', 'deliveryAddress']
const applicationSummaryCheckUrl = `${urlPrefix}/application-summary/check`

function clearChangeRoute(request) {
    setYarValue(request, "changeRouteData", null)
}

function setChangeRoute(request, changeType, applicationIndex) {
    let startUrl = ""
    let endUrl = ""
    let confirm = false

    switch (changeType) {
        case "permitType":
            startUrl = `${urlPrefix}/permit-type`
            endUrl = 'to be defined'
            confirm = true
            break
        case "agentContactDetails"://DONE
            startUrl = `${urlPrefix}/contact-details/agent`
            confirm = true
            break
        case "agentAddress"://DONE
            startUrl = `${urlPrefix}/postcode/agent`
            endUrl = `${urlPrefix}/confirm-address/agent`
            confirm = true
            break
        case "applicantContactDetails"://DONE
            startUrl = `${urlPrefix}/contact-details/applicant`
            confirm = true
            break
        case "applicantAddress"://DONE
            startUrl = `${urlPrefix}/postcode/applicant`
            endUrl = `${urlPrefix}/confirm-address/applicant`
            confirm = true
            break
        case "deliveryAddress":
            startUrl = `${urlPrefix}/postcode/delivery`
            endUrl = `${urlPrefix}/confirm-address/delivery`
            confirm = true
            break
        case "speciesName":
            startUrl = `${urlPrefix}/species-name/${applicationIndex}`
            endUrl = 'to be defined'
            confirm = true
            break
        case "sourceCode"://DONE
            startUrl = `${urlPrefix}/source-code/${applicationIndex}`
            break
        case "purposeCode":
            startUrl = `${urlPrefix}/purpose-code/${applicationIndex}`
            break
        case "uniqueIdentificationMark":
            startUrl = `${urlPrefix}/unique-identification-mark/${applicationIndex}`
            break
        case "tradeTermCode":
            startUrl = `${urlPrefix}/trade-term-code/${applicationIndex}`
            break
        case "useCertificateFor":
            startUrl = `${urlPrefix}/use-certificate-for/${applicationIndex}`
            break
        case "describeLivingAnimal":
        case "unmarkedSpecimens":
        case "createdDate":
        case "descriptionGeneric":
        case "acquiredDate":
        case "a10CertificateNumber":
        case "importerExporterDetails":
        case "permitDetails":
        case "comments":
            throw new Error(`Change type not handled yet: ${changeType}`)
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

function getChangeRouteData(request) {
    return getYarValue(request, "changeRouteData")
}

module.exports = {
    checkChangeRouteExit,
    setChangeRoute,
    clearChangeRoute,
    getChangeRouteData,
    changeTypes
}
