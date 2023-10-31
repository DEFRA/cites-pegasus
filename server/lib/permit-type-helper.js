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

function getPermit(permitTypeOption) {

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
            throw('Unknown permit type')
    }

    return permit
}

module.exports = {
    getPermit,
    ...constants
}