const { parseTwoDigitYear } = require("moment")
const { urlPrefix, maxNumberOfUniqueIdentifiers } = require("../../config/config")
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
    'multipleSpecimens',
    'createdDate',
    'specimenType',
    'descriptionGeneric',
    'importerExporterDetails',
    'originPermitDetails',
    'countryOfOriginImport',
    'exportPermitDetails',
    'importPermitDetails',
    'additionalInfo',
    'hasUniqueIdentificationMark',
    'uniqueIdentificationMark',
    'everImportedExported',
    'specimenOrigin',
    'breeder',
    'addExportPermit',
    'importerDetails']

const applicationSummaryCheckUrl = `${urlPrefix}/application-summary/check`

function setChangeRoute(request, changeType, applicationIndex, returnUrl, permitTypeOption) {
    const startUrls = []
    const endUrls = []
    let confirm = false

    switch (changeType) {
        case "permitType"://Change flow
            startUrls.push({ url: `${urlPrefix}/permit-type` })
            if (permitTypeOption === pto.OTHER) {
                startUrls.push({ url: `${urlPrefix}/other-permit-type` })//This is the only case so far for 2 start urls and it's because it's 2 pages that are basically capturing the same thing
            }
            endUrls.push({ url: `${urlPrefix}/additional-info/${applicationIndex}` })//You must go all the way through the flow                        
            confirm = true
            break
        case "applicantContactDetails":
            startUrls.push({ url: `${urlPrefix}/contact-details/applicant` })
            confirm = true
            break
        case "applicantAddress":      //Change flow
            startUrls.push({ url: `${urlPrefix}/postcode/applicant` })
            endUrls.push({ url: `${urlPrefix}/confirm-address/applicant` })
            confirm = true
            break
        case "deliveryAddress":       //Change flow
            startUrls.push({ url: `${urlPrefix}/postcode/delivery` })
            endUrls.push({ url: `${urlPrefix}/confirm-address/delivery` })
            confirm = true
            break
        case "deliveryType":       //Change flow
            startUrls.push({ url: `${urlPrefix}/delivery-type` })
            break
        case "speciesName":           //Change flow
            startUrls.push({ url: `${urlPrefix}/species-name/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/describe-specimen/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/describe-living-animal/${applicationIndex}` })
            confirm = true
            break
        case "quantity":
            startUrls.push({ url: `${urlPrefix}/quantity/${applicationIndex}` })
            break
        case "multipleSpecimens":
            startUrls.push({ url: `${urlPrefix}/multiple-specimens/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/describe-specimen/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/describe-living-animal/${applicationIndex}` })
            confirm = true
            break
        case "sourceCode":
            startUrls.push({ url: `${urlPrefix}/source-code/${applicationIndex}` })
            break
        case "purposeCode":
            startUrls.push({ url: `${urlPrefix}/purpose-code/${applicationIndex}` })
            break
        case "specimenType"://Change flow   
            startUrls.push({ url: `${urlPrefix}/specimen-type/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/describe-specimen/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/describe-living-animal/${applicationIndex}` })
            break
        case "tradeTermCode":
            startUrls.push({ url: `${urlPrefix}/trade-term-code/${applicationIndex}` })
            break
        case "hasUniqueIdentificationMark":
            startUrls.push({ url: `${urlPrefix}/has-unique-identification-mark/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/unique-identification-mark/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/describe-specimen/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/describe-living-animal/${applicationIndex}` })
            break
        case "uniqueIdentificationMark":
            startUrls.push({ url: `${urlPrefix}/unique-identification-mark/${applicationIndex}`, matchType: 'includes' })
            break
        case "specimenOrigin":
            startUrls.push({ url: `${urlPrefix}/specimen-origin/${applicationIndex}` })
            break
        case "useCertificateFor":
            startUrls.push({ url: `${urlPrefix}/use-certificate-for/${applicationIndex}` })
            break
        case "describeLivingAnimal":
            startUrls.push({ url: `${urlPrefix}/describe-living-animal/${applicationIndex}` })
            break
        case "breeder":
            startUrls.push({ url: `${urlPrefix}/breeder/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/acquired-date/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/already-have-a10/${applicationIndex}` })
            break
        case "acquiredDate":
            startUrls.push({ url: `${urlPrefix}/acquired-date/${applicationIndex}` })
            break
        case "a10CertificateNumber":
            startUrls.push({ url: `${urlPrefix}/already-have-a10/${applicationIndex}` })
            break
        case "createdDate":
            startUrls.push({ url: `${urlPrefix}/created-date/${applicationIndex}` })
            break
        case "descriptionGeneric":
            startUrls.push({ url: `${urlPrefix}/describe-specimen/${applicationIndex}` })
            break
        case "everImportedExported"://CHANGE FLOW
            startUrls.push({ url: `${urlPrefix}/ever-imported-exported/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/ever-imported-exported/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/origin-permit-details/${applicationIndex}` })
            break
        case "importerExporterDetails":
            startUrls.push({ url: `${urlPrefix}/importer-exporter/${applicationIndex}` })
            break
        case "originPermitDetails":
            startUrls.push({ url: `${urlPrefix}/origin-permit-details/${applicationIndex}` })
            break
        case "countryOfOriginImport":
            startUrls.push({ url: `${urlPrefix}/country-of-origin-import/${applicationIndex}` })
            break
        case "exportPermitDetails":
            startUrls.push({ url: `${urlPrefix}/export-permit-details/${applicationIndex}` })
            break
        case "importPermitDetails":
            startUrls.push({ url: `${urlPrefix}/import-permit-details/${applicationIndex}` })
            break
        case "additionalInfo":
            startUrls.push({ url: `${urlPrefix}/additional-info/${applicationIndex}` })
            break
        case "addExportPermit":
            startUrls.push({ url: `${urlPrefix}/add-export-permit/${applicationIndex}` })
            endUrls.push({ url: `${urlPrefix}/importer-details/${applicationIndex}` })
            break
        case "importerDetails":
            startUrls.push({ url: `${urlPrefix}/importer-details/${applicationIndex}` })
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
        const firstStartUrl = changeData.startUrls[0]
        const lastStartUrl = changeData.startUrls[changeData.startUrls.length - 1]

        const matchesEndUrl = changeData.endUrls.some(endUrl => urlCompare(request.headers.referer, endUrl.url, endUrl.matchType))
        const matchesFirstStartUrl = urlCompare(request.path, firstStartUrl.url, firstStartUrl.matchType)
        const matchesLastStartUrl = urlCompare(request.path, lastStartUrl.url, lastStartUrl.matchType)

        if (isBack) {
            if (!changeData.dataRemoved && matchesFirstStartUrl) {
                return changeData.returnUrl
            }
        } else if (matchesEndUrl || (isMinorOrNoChange && !changeData.dataRemoved && matchesLastStartUrl)) {
            return changeData.returnUrl
        } else {
            //Do nothing
        }
    }
    return null
}

function urlCompare(fullUrl, partialUrl, matchType) {
    return matchType === 'includes' ? fullUrl?.includes(partialUrl) : fullUrl?.endsWith(partialUrl)
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
