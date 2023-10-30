const { urlPrefix } = require("../../config/config")
const { setYarValue, getYarValue } = require("../lib/session")
const changeTypes = [
    'permitType',
    'applicantContactDetails',
    'agentContactDetails',
    'applicantAddress',
    'agentAddress',
    'deliveryAddress',
    'deliveryType',
    'sourceCode',
    'speciesName',
    'quantity',
    'purposeCode',
    'tradeTermCode',
    'describeLivingAnimal',
    'useCertificateFor',
    'acquiredDate',
    'a10CertificateNumber',
    'unmarkedSpecimens',
    'createdDate',
    'specimenType',
    'descriptionGeneric',
    'importerExporterDetails',
    'permitDetails',
    'additionalInfo',
    'uniqueIdentificationMark',
    'everImportedExported',
    'specimenOrigin']

const applicationSummaryCheckUrl = `${urlPrefix}/application-summary/check`

function setChangeRoute(request, changeType, applicationIndex, returnUrl) {
    let startUrl = ""
    const endUrls = []
    let confirm = false

    switch (changeType) {
        case "permitType"://Change flow
            startUrl = `${urlPrefix}/permit-type`
            endUrls.push(`${urlPrefix}/additional-info/${applicationIndex}`)//You must go all the way through the flow                        
            confirm = true
            break
        case "applicantContactDetails":
            startUrl = `${urlPrefix}/contact-details/applicant`
            confirm = true
            break
        case "applicantAddress":      //Change flow
            startUrl = `${urlPrefix}/postcode/applicant`
            endUrls.push(`${urlPrefix}/confirm-address/applicant`)
            confirm = true
            break
        case "deliveryAddress":       //Change flow
            startUrl = `${urlPrefix}/postcode/delivery`
            endUrls.push(`${urlPrefix}/confirm-address/delivery`)
            confirm = true
            break
        case "deliveryType":       //Change flow
            startUrl = `${urlPrefix}/delivery-type`
            break
        case "speciesName":           //Change flow
            startUrl = `${urlPrefix}/species-name/${applicationIndex}`
            endUrls.push(`${urlPrefix}/describe-specimen/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-living-animal/${applicationIndex}`)
            confirm = true
            break
        case "quantity":
            startUrl = `${urlPrefix}/quantity/${applicationIndex}`
            break
        case "sourceCode":
            startUrl = `${urlPrefix}/source-code/${applicationIndex}`
            break
        case "purposeCode":
            startUrl = `${urlPrefix}/purpose-code/${applicationIndex}`
            break
        case "specimenType"://Change flow   
            startUrl = `${urlPrefix}/specimen-type/${applicationIndex}`
            endUrls.push(`${urlPrefix}/describe-specimen/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-living-animal/${applicationIndex}`)
            break
        case "tradeTermCode":
            startUrl = `${urlPrefix}/trade-term-code/${applicationIndex}`
            break
        case "uniqueIdentificationMark"://Change flow   //DDNE
            startUrl = `${urlPrefix}/unique-identification-mark/${applicationIndex}`
            endUrls.push(`${urlPrefix}/describe-specimen/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-living-animal/${applicationIndex}`)
            break
        case "specimenOrigin":
            startUrl = `${urlPrefix}/specimen-origin/${applicationIndex}`
            break
        case "useCertificateFor":
            startUrl = `${urlPrefix}/use-certificate-for/${applicationIndex}`
            break
        case "describeLivingAnimal":
            startUrl = `${urlPrefix}/describe-living-animal/${applicationIndex}`
            break
        case "acquiredDate":
            startUrl = `${urlPrefix}/acquired-date/${applicationIndex}`
            break
        case "a10CertificateNumber":
            startUrl = `${urlPrefix}/already-have-a10/${applicationIndex}`
            break
        case "unmarkedSpecimens":
            startUrl = `${urlPrefix}/unmarked-specimens/${applicationIndex}`
            break
        case "createdDate":
            startUrl = `${urlPrefix}/created-date/${applicationIndex}`
            break
        case "descriptionGeneric":
            startUrl = `${urlPrefix}/describe-specimen/${applicationIndex}`
            break
        case "everImportedExported"://CHANGE FLOW
            startUrl = `${urlPrefix}/ever-imported-exported/${applicationIndex}`
            endUrls.push(`${urlPrefix}/ever-imported-exported/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/permit-details/${applicationIndex}`)
            break
        case "importerExporterDetails":
            startUrl = `${urlPrefix}/importer-exporter/${applicationIndex}`
            break
        case "permitDetails":
            startUrl = `${urlPrefix}/permit-details/${applicationIndex}`
            break
        case "additionalInfo":
            startUrl = `${urlPrefix}/additional-info/${applicationIndex}`
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

    if (endUrls.length === 0) {
        endUrls.push(startUrl)
    }

    const changeRouteData = { changeType, showConfirmationPage: confirm, startUrl, endUrls, applicationIndex, returnUrl }

    setYarValue(request, "changeRouteData", changeRouteData)

    return changeRouteData
}

function checkChangeRouteExit(request, isBack, isMinorOrNoChange = false) {
    const changeData = getYarValue(request, "changeRouteData")
    if (changeData) {
        const matchesEndUrl = changeData.endUrls.some(endUrl => request.headers.referer?.endsWith(endUrl))

        const matchesStartUrl = request.path.endsWith(changeData.startUrl)

        if ((!isBack && matchesEndUrl) || (!isBack && isMinorOrNoChange && !changeData.dataRemoved && matchesStartUrl) || (isBack && !changeData.dataRemoved && matchesStartUrl)) {
            return changeData.returnUrl
            //return `${applicationSummaryCheckUrl}/${changeData.applicationIndex}`
        }
    }
    return null
}

function setDataRemoved(request) { //This is used to stop the back button taking a user back to the check your answers page
    const changeRouteData = getChangeRouteData(request)
    if (!changeRouteData) {
        return
    }
    changeRouteData.dataRemoved = true
    setYarValue(request, "changeRouteData", changeRouteData)
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
    changeTypes,
    setDataRemoved
}
