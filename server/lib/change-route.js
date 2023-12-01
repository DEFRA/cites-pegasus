const { parseTwoDigitYear } = require("moment")
const { urlPrefix } = require("../../config/config")
const { setYarValue, getYarValue } = require("../lib/session")
const { permitTypeOption: pto, getPermit } = require('../lib/permit-type-helper')
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

function setChangeRoute(request, changeType, applicationIndex, returnUrl, permitTypeOption) {
    const startUrls = []
    const endUrls = []
    let confirm = false

    switch (changeType) {
        case "permitType"://Change flow
            startUrls.push(`${urlPrefix}/permit-type`)
            if(permitTypeOption === pto.OTHER){
                startUrls.push(`${urlPrefix}/other-permit-type`)//This is the only case so far for 2 start urls and it's because it's 2 pages that are basically capturing the same thing
            }
            endUrls.push(`${urlPrefix}/additional-info/${applicationIndex}`)//You must go all the way through the flow                        
            confirm = true
            break
        case "applicantContactDetails":
            startUrls.push(`${urlPrefix}/contact-details/applicant`)
            confirm = true
            break
        case "applicantAddress":      //Change flow
            startUrls.push(`${urlPrefix}/postcode/applicant`)
            endUrls.push(`${urlPrefix}/confirm-address/applicant`)
            confirm = true
            break
        case "deliveryAddress":       //Change flow
            startUrls.push(`${urlPrefix}/postcode/delivery`)
            endUrls.push(`${urlPrefix}/confirm-address/delivery`)
            confirm = true
            break
        case "deliveryType":       //Change flow
            startUrls.push(`${urlPrefix}/delivery-type`)
            break
        case "speciesName":           //Change flow
            startUrls.push(`${urlPrefix}/species-name/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-specimen/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-living-animal/${applicationIndex}`)
            confirm = true
            break
        case "quantity":
            startUrls.push(`${urlPrefix}/quantity/${applicationIndex}`)
            break
        case "sourceCode":
            startUrls.push(`${urlPrefix}/source-code/${applicationIndex}`)
            break
        case "purposeCode":
            startUrls.push(`${urlPrefix}/purpose-code/${applicationIndex}`)
            break
        case "specimenType"://Change flow   
            startUrls.push(`${urlPrefix}/specimen-type/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-specimen/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-living-animal/${applicationIndex}`)
            break
        case "tradeTermCode":
            startUrls.push(`${urlPrefix}/trade-term-code/${applicationIndex}`)
            break
        case "uniqueIdentificationMark"://Change flow   //DDNE
            startUrls.push(`${urlPrefix}/unique-identification-mark/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-specimen/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/describe-living-animal/${applicationIndex}`)
            break
        case "specimenOrigin":
            startUrls.push(`${urlPrefix}/specimen-origin/${applicationIndex}`)
            break
        case "useCertificateFor":
            startUrls.push(`${urlPrefix}/use-certificate-for/${applicationIndex}`)
            break
        case "describeLivingAnimal":
            startUrls.push(`${urlPrefix}/describe-living-animal/${applicationIndex}`)
            break
        case "acquiredDate":
            startUrls.push(`${urlPrefix}/acquired-date/${applicationIndex}`)
            break
        case "a10CertificateNumber":
            startUrls.push(`${urlPrefix}/already-have-a10/${applicationIndex}`)
            break
        case "createdDate":
            startUrls.push(`${urlPrefix}/created-date/${applicationIndex}`)
            break
        case "descriptionGeneric":
            startUrls.push(`${urlPrefix}/describe-specimen/${applicationIndex}`)
            break
        case "everImportedExported"://CHANGE FLOW
            startUrls.push(`${urlPrefix}/ever-imported-exported/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/ever-imported-exported/${applicationIndex}`)
            endUrls.push(`${urlPrefix}/permit-details/${applicationIndex}`)
            break
        case "importerExporterDetails":
            startUrls.push(`${urlPrefix}/importer-exporter/${applicationIndex}`)
            break
        case "permitDetails":
            startUrls.push(`${urlPrefix}/permit-details/${applicationIndex}`)
            break
        case "additionalInfo":
            startUrls.push(`${urlPrefix}/additional-info/${applicationIndex}`)
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
        endUrls.push(startUrls[0])
    }

    const changeRouteData = { changeType, showConfirmationPage: confirm, startUrls, endUrls, applicationIndex, returnUrl }

    setYarValue(request, "changeRouteData", changeRouteData)

    return changeRouteData
}

function checkChangeRouteExit(request, isBack, isMinorOrNoChange = false) {
    const changeData = getYarValue(request, "changeRouteData")
    if (changeData) {
        const matchesEndUrl = changeData.endUrls.some(endUrl => request.headers.referer?.endsWith(endUrl))

        //const matchesStartUrl = request.path.endsWith(changeData.startUrl)
        const matchesFirstStartUrl = request.path.endsWith(changeData.startUrls[0])
        const matchesLastStartUrl = request.path.endsWith(changeData.startUrls[changeData.startUrls.length - 1])
        //const matchesStartUrl = changeData.startUrls.some(startUrl => request.path.endsWith(startUrl))


        if ((!isBack && matchesEndUrl) || (!isBack && isMinorOrNoChange && !changeData.dataRemoved && matchesLastStartUrl) || (isBack && !changeData.dataRemoved && matchesFirstStartUrl)) {
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
