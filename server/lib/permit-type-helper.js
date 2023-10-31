const constants = {
    permitTypeOption: {
        import: 'import',
        export: 'export',
        reexport: 'reexport',
        article10: 'article10',
        mic: 'mic',
        tec: 'tec',
        poc: 'poc',
        semiComplete: 'semiComplete',
        draft: 'draft',
        other: 'other'
    },
    permitType: {
        import: 'import',
        export: 'export',
        reexport: 'reexport',
        article10: 'article10',
        mic: 'mic',
        tec: 'tec',
        poc: 'poc'
    },
    permitSubType: {
        semiComplete: 'semiComplete',
        draft: 'draft',
        article9Movement: 'article9Movement',
        legalAcquisition: 'legalAcquisition'
    }
}

const { permitTypeOption: pto, permitType: pt, permitSubType: pst } = constants

function getPermit(permitTypeOption) {

    const permit = {
        permitType: null,
        permitSubType: null
    }

    switch (permitTypeOption) {
        case pto.import:
            permit.permitType = pt.import
            break
        case pto.export:
            permit.permitType = pt.export
            break
        case pto.reexport:
            permit.permitType = pt.reexport
            break
        case pto.article10:
            permit.permitType = pt.article10
            break
        case pto.mic:
            permit.permitType = pt.mic
            break
        case pto.tec:
            permit.permitType = pt.tec
            break
        case pto.poc:
            permit.permitType = pt.poc
            break
        case pto.semiComplete:
            permit.permitType = pt.reexport
            permit.permitSubType = pst.semiComplete
            break
        case pto.draft:
            permit.permitType = pt.import
            permit.permitSubType = pst.draft
            break
        case pto.other:
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