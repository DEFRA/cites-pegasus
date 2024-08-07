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
        NOT_FOUND: 404,
        PAYLOAD_TOO_LARGE: 413
    }
}