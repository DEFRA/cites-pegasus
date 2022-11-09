const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../helpers/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../helpers/app-data')
const { ADDRESS_REGEX } = require('../helpers/regex-validation')
const textContent = require('../content/text-content')
const postcode = require('./postcode')
const pageId = 'select-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPostcode = `${urlPrefix}/postcode`
const previousPathAddress = `${urlPrefix}/search-address`
const partyTypes = ['agent', 'applicant']
//const nextPath = `${urlPrefix}/select-address`
const invalidAppDataPath = urlPrefix

function createModel(errorList, data) {
    const commonContent = textContent.common;
    let pageContent = null

    if(data.partyType === 'applicant'){
        if(data.isAgent){
            pageContent = textContent.selectAddress.agentLed
        } else {
            pageContent = textContent.selectAddress.applicant
        }
    } else {
        pageContent = textContent.selectAddress.agent
    }



    const model = {
        searchType: data.postcode ? `Postcode search - ${data.postcode}` : `Address search: - ${data.property}`,
        backLink: `${data.postcode ? previousPathPostcode : previousPathAddress}/${data.partyType}`,
        pageHeader: pageContent.pageHeader,
        //         pageBody: pageContent.pageBody,
        //         formActionPage: `${currentPath}/${data.partyType}`,
                 ...errorList ? { errorList } : {},
                 pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
        //         linkText: pageContent.linkUnknownPostcode,
        //         linkUrl: `/search-address/${data.partyType}`,
        //         inputProperty: {
        //             label: {
        //                 text: pageContent.inputLabelProperty
        //             },
        //             id: "property",
        //             name: "property",
        //             classes: "govuk-!-width-two-thirds",
        //             ...(data.property ? { value: data.property } : {}),
        //             errorMessage: getFieldError(errorList, '#property')
        //         },
        //         inputStreet: {
        //             label: {
        //                 text: pageContent.inputLabelStreet
        //             },
        //             id: "street",
        //             name: "street",
        //             classes: "govuk-!-width-two-thirds",
        //             ...(data.street ? { value: data.street } : {}),
        //             errorMessage: getFieldError(errorList, '#street')
        //         },
        //         inputTown: {
        //             label: {
        //                 text: pageContent.inputLabelTown
        //             },
        //             id: "town",
        //             name: "town",
        //             classes: "govuk-!-width-two-thirds",
        //             ...(data.town ? { value: data.town } : {}),
        //             errorMessage: getFieldError(errorList, '#town')
        //         }
    }
    return { ...commonContent, ...model }
}

function validateSearchData(searchData) {
    if (searchData.postcode && (searchData.property || searchData.street || searchData.town)) {
        throw "must be postcode or address search, not both"
    } else if (!searchData.postcode && !searchData.property && !searchData.street && !searchData.town) {
        throw "must provide postcode or address search details"
    }
}

module.exports = [{
    method: 'GET',
    path: `${currentPath}/{partyType}`,
    options: {
        validate: {
            params: Joi.object({
                partyType: Joi.string().valid(...partyTypes)
            }),
            failAction: (request, h, error) => {
                console.log(error)
            }
        }
    },
    handler: async (request, h) => {
        const appData = getAppData(request);

        try {
            validateAppData(appData, `${pageId}/${request.params.partyType}`)
            validateSearchData(appData[request.params.partyType].addressSearchData)
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
        }

        const pageData = { partyType: request.params.partyType, isAgent: appData.isAgent, ...appData[request.params.partyType].addressSearchData }
        return h.view(pageId, createModel(null, pageData));

    }
},
    // {
    //     method: 'POST',
    //     path: `${currentPath}/{partyType}`,
    //     options: {
    //         validate: {
    //             params: Joi.object({
    //                 partyType: Joi.string().valid(...partyTypes)
    //             }),
    //             options: { abortEarly: false },
    //             payload: Joi.object({
    //                 property: Joi.string().regex(ADDRESS_REGEX),
    //                 street: Joi.string().regex(ADDRESS_REGEX),
    //                 town: Joi.string().regex(ADDRESS_REGEX)
    //             }),
    //             failAction: (request, h, err) => {
    //                 const errorList = []
    //                 const fields = ['property', 'street', 'town']
    //                 fields.forEach(field => {
    //                     const fieldError = findErrorList(err, [field])[0]
    //                     if (fieldError) {
    //                         errorList.push({
    //                             text: fieldError,
    //                             href: `#${field}`
    //                         })
    //                     }
    //                 })

//                     const appData = getAppData(request);
    //                 const pageData = { partyType: request.params.partyType, isAgent: appData.isAgent, ...request.payload }
    //                 return h.view(pageId, createModel(errorList, pageData)).takeover()
    //             }
    //         },
    //         handler: async (request, h) => {
    //             const partyType = request.params.partyType


    //             const appData = {
    //                 [partyType]: {
    //                     addressSearchData: {
    //                         property: request.payload.property,
    //                         street: request.payload.street,                        
    //                         town: request.payload.town
    //                     }
    //                 }
    //             }

    //             try {
    //                 setAppData(request, appData, `${pageId}/${partyType}`)
    //             }
    //             catch (err) {
    //                 console.log(err);
    //                 return h.redirect(`${invalidAppDataPath}/`)
    //             }

    //             return h.redirect(`${nextPath}/${partyType}`)
    //         }
    //     },
    // }
]