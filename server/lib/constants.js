module.exports = {
    deliveryType: {
        STANDARD_DELIVERY: 'standardDelivery',
        SPECIAL_DELIVERY: 'specialDelivery'
    },
    certificateUse: {
        LEGALLY_ACQUIRED: 'legallyAcquired',
        COMMERCIAL_ACTIVITIES: 'commercialActivities',
        NON_DETRIMENTAL_PURPOSES: 'nonDetrimentalPurposes',
        DISPLAY_WITHOUT_SALE: 'displayWithoutSale',
        MOVE_LIVE_SPECIMEN: 'moveALiveSpecimen'
    },
    httpStatusCode: {
        OK: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500
    },
    summaryType: {
        CHECK: 'check',
        VIEW: 'view',
        COPY: 'copy',
        VIEW_SUBMITTED: 'view-submitted',
        COPY_AS_NEW: 'copy-as-new'
    },
    govukClass: {
        WIDTH_TWO_THIRDS: 'govuk-!-width-two-thirds',
        FONT_WEIGHT_BOLD: 'govuk-!-font-weight-bold'
    },
    stringLength: {
        max50: 50,
        max150: 150,
        max500: 500,
        max1000: 1000,
        min3: 3,
        min5: 5
    }
}