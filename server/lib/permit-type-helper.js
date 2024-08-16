const textContent = require("../content/text-content")
const { certificateUse: cu } = require("../lib/constants")

const constants = {
    permitTypeOption: {
        IMPORT: 'import',
        EXPORT: 'export',
        REEXPORT: 'reexport',
        ARTICLE_10: 'article10',
        MIC: 'mic',
        TEC: 'tec',
        POC: 'poc',
        SEMI_COMPLETE: 'semiComplete',
        DRAFT: 'draft',
        OTHER: 'other'
    },
    permitType: {
        IMPORT: 'import',
        EXPORT: 'export',
        REEXPORT: 'reexport',
        ARTICLE_10: 'article10',
        MIC: 'mic',
        TEC: 'tec',
        POC: 'poc'
    },
    permitSubType: {
        SEMI_COMPLETE: 'semiComplete',
        DRAFT: 'draft',
        ARTICLE_9_MOVEMENT: 'article9Movement',
        LEGAL_ACQUISITION: 'legalAcquisition'
    }
}

const { permitTypeOption: pto, permitType: pt, permitSubType: pst } = constants

function getPermitDescription(permitType, permitSubType) {
    const commonContent = textContent.common
    
    if (permitSubType) {
        switch (permitSubType) {
            case pst.SEMI_COMPLETE:
                return commonContent.permitTypeDescriptionSemiComplete
            case pst.DRAFT:
                return commonContent.permitTypeDescriptionDraft
            case pst.ARTICLE_9_MOVEMENT:
                return commonContent.permitTypeDescriptionArticle10
            case pst.LEGAL_ACQUISITION:
                return commonContent.permitTypeDescriptionArticle10
            default:
                throw new Error(`Invalid permit sub type: ${permitSubType}`)
        }
    }

    switch (permitType) {
        case pt.IMPORT:
            return commonContent.permitTypeDescriptionImport
        case pt.EXPORT:
            return commonContent.permitTypeDescriptionExport
        case pt.REEXPORT:
            return commonContent.permitTypeDescriptionReexport
        case pt.ARTICLE_10:
            return commonContent.permitTypeDescriptionArticle10
        case pt.MIC:
            return commonContent.permitTypeDescriptionMIC
        case pt.TEC:
            return commonContent.permitTypeDescriptionTEC
        case pt.POC:
            return commonContent.permitTypeDescriptionPOC
        default:
            throw new Error(`Invalid permit type: ${permitSubType}`)
    }
}

function getPermit(permitTypeOption, useCertificateFor) {

    const permit = {
        permitType: null,
        permitSubType: null
    }

    switch (permitTypeOption) {
        case pto.IMPORT:
            permit.permitType = pt.IMPORT
            break
        case pto.EXPORT:
            permit.permitType = pt.EXPORT
            break
        case pto.REEXPORT:
            permit.permitType = pt.REEXPORT
            break
        case pto.ARTICLE_10:
            permit.permitType = pt.ARTICLE_10
            permit.permitSubType = getA10PermitSubType(useCertificateFor)
            break
        case pto.MIC:
            permit.permitType = pt.MIC
            break
        case pto.TEC:
            permit.permitType = pt.TEC
            break
        case pto.POC:
            permit.permitType = pt.POC
            break
        case pto.SEMI_COMPLETE:
            permit.permitType = pt.REEXPORT
            permit.permitSubType = pst.SEMI_COMPLETE
            break
        case pto.DRAFT:
            permit.permitType = pt.IMPORT
            permit.permitSubType = pst.DRAFT
            break
        case pto.OTHER:
            break
        default:
            throw new Error(`Invalid permit type option: ${permitTypeOption}`)
    }     

    return permit
}

function getA10PermitSubType(useCertificateFor) {
    switch (useCertificateFor) {
        case cu.LEGALLY_ACQUIRED:
            return pst.LEGAL_ACQUISITION
        case cu.MOVE_LIVE_SPECIMEN:
            return pst.ARTICLE_9_MOVEMENT
        default:
            return null
    }
}

module.exports = {
    getPermit,
    getPermitDescription,
    ...constants
}