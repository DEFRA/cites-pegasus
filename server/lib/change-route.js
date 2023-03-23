const urlPrefix = require("../../config/config").urlPrefix
const { setYarValue, getYarValue } = require("../lib/session")
const changeTypes = ['permitType', 'applicantContactDetails', 'agentContactDetails', 'applicantAddress', 'agentAddress', 'deliveryAddress', 'sourceCode', 'speciesName', 'quantity', 'purposeCode', 'tradeTermCode', 'describeLivingAnimal']
const applicationSummaryCheckUrl = `${urlPrefix}/application-summary/check`

function setChangeRoute(request, changeType, applicationIndex) {
    let startUrl = ""
    const endUrls = []
    let confirm = false

    switch (changeType) {
        case "permitType"://Change flow
            startUrl = `${urlPrefix}/permit-type`
            endUrls.push('')//You must go all the way through the flow                        
            confirm = true
            break
        case "agentContactDetails"://DONE
            startUrl = `${urlPrefix}/contact-details/agent`
            confirm = true
            break
        case "agentAddress"://DONE  //Change flow
            startUrl = `${urlPrefix}/postcode/agent`
            endUrls.push(`${urlPrefix}/confirm-address/agent`)
            confirm = true
            break
        case "applicantContactDetails"://DONE
            startUrl = `${urlPrefix}/contact-details/applicant`
            confirm = true
            break
        case "applicantAddress"://DONE      //Change flow
            startUrl = `${urlPrefix}/postcode/applicant`
            endUrls.push(`${urlPrefix}/confirm-address/applicant`)
            confirm = true
            break
        case "deliveryAddress"://DONE       //Change flow
            startUrl = `${urlPrefix}/postcode/delivery`
            endUrls.push(`${urlPrefix}/confirm-address/delivery`)
            confirm = true
            break
        case "speciesName"://Change flow
            startUrl = `${urlPrefix}/species-name/${applicationIndex}`
            endUrls.push('to be defined')
            confirm = true
            break
        case "quantity"://DONE
            startUrl = `${urlPrefix}/quantity/${applicationIndex}`
            break
        case "sourceCode"://DONE
            startUrl = `${urlPrefix}/source-code/${applicationIndex}`
            break            
        case "purposeCode":
            startUrl = `${urlPrefix}/purpose-code/${applicationIndex}`
            break

        case "specimenType"://Change flow
        case "tradeTermCode":
            startUrl = `${urlPrefix}/trade-term-code/${applicationIndex}`
            break
        case "uniqueIdentificationMark"://Change flow
            startUrl = `${urlPrefix}/unique-identification-mark/${applicationIndex}`
            break
        case "useCertificateFor":
            startUrl = `${urlPrefix}/use-certificate-for/${applicationIndex}`
            break
        case "describeLivingAnimal":
            startUrl = `${urlPrefix}/describe-living-animal/${applicationIndex}`
            break
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

    if (endUrls.length === 0) {
        endUrls.push(startUrl)
    }

    const changeRouteData = { changeType: changeType, showConfirmationPage: confirm, startUrl: startUrl, endUrls: endUrls, applicationIndex: applicationIndex }

    setYarValue(request, "changeRouteData", changeRouteData)

    return changeRouteData
}

function checkChangeRouteExit(request, isBack = false) {
    const changeData = getYarValue(request, "changeRouteData")
    if (changeData) {
        // if ((!isBack && request.headers.referer.endsWith(changeData.endUrl))
        //     || (isBack && request.path.endsWith(changeData.startUrl))) {
        //     return `${applicationSummaryCheckUrl}/${changeData.applicationIndex}`
        // }
                
        const matchesEndUrl = changeData.endUrls.some(endUrl => request.headers.referer?.endsWith(endUrl))
        const matchesStartUrl = request.path.endsWith(changeData.startUrl)

        if ((!isBack && matchesEndUrl) || (isBack && matchesStartUrl)) {
            return `${applicationSummaryCheckUrl}/${changeData.applicationIndex}`
        }
    }
    return null
}

function getChangeRouteData(request) {
    return getYarValue(request, "changeRouteData")
}

function clearChangeRoute(request) {
    setYarValue(request, "changeRouteData", null)
}

module.exports = {
    checkChangeRouteExit,
    setChangeRoute,
    clearChangeRoute,
    getChangeRouteData,
    changeTypes
}
