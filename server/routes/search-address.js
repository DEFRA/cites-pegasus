const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../lib/app-data')
const { ADDRESS_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'search-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/postcode`
const partyTypes = ['agent', 'applicant']
const nextPath = `${urlPrefix}/select-address`
const invalidAppDataPath = urlPrefix


function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    if(data.partyType === 'applicant'){
        if(data.isAgent){
            pageContent = textContent.searchAddress.agentLed
        } else {
            pageContent = textContent.searchAddress.applicant
        }
    } else {
        pageContent = textContent.searchAddress.agent
    }

    let defaultTitle = ''
    let pageHeader = ''
    let errorMessages = null

    switch (data.permitType) {
        case 'import':
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            errorMessages = pageContent.errorMessagesImport
            break;
        case 'export':
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            errorMessages = pageContent.errorMessagesExport
            break;
        case 'reexport':
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            errorMessages = pageContent.errorMessagesReexport
            break;
        case 'article10':
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
            errorMessages = pageContent.errorMessagesArticle10
            break;
    }

    let errorList = null
    if(errors){
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...errorMessages }
        const fields = ['property', 'street', 'town']
        fields.forEach(field => {
            const fieldError = findErrorList(errors, [field], mergedErrorMessages)[0]
            if (fieldError) {
                errorList.push({
                    text: fieldError,
                    href: `#${field}`
                })
            }
        })
    }

    const model = {
        backLink: `${previousPath}/${data.partyType}`,
        pageHeader: pageHeader,
        pageBody: pageContent.pageBody,
        formActionPage: `${currentPath}/${data.partyType}`,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : defaultTitle,
        linkText: pageContent.linkUnknownPostcode,
        linkUrl: `/search-address/${data.partyType}`,
        inputProperty: {
            label: {
                text: pageContent.inputLabelProperty
            },
            id: "property",
            name: "property",
            classes: "govuk-!-width-two-thirds",
            ...(data.property ? { value: data.property } : {}),
            errorMessage: getFieldError(errorList, '#property')
        },
        inputStreet: {
            label: {
                text: pageContent.inputLabelStreet
            },
            id: "street",
            name: "street",
            classes: "govuk-!-width-two-thirds",
            ...(data.street ? { value: data.street } : {}),
            errorMessage: getFieldError(errorList, '#street')
        },
        inputTown: {
            label: {
                text: pageContent.inputLabelTown
            },
            id: "town",
            name: "town",
            classes: "govuk-!-width-two-thirds",
            ...(data.town ? { value: data.town } : {}),
            errorMessage: getFieldError(errorList, '#town')
        }
    }

    return { ...commonContent, ...model }
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
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
        }

        const pageData = { 
            partyType: request.params.partyType, 
            isAgent: appData?.isAgent, 
            permitType: appData?.permitType, 
            ...appData[request.params.partyType].addressSearchData 
        }

        return h.view(pageId, createModel(null, pageData));
    }
},
{
    method: 'POST',
    path: `${currentPath}/{partyType}`,
    options: {
        validate: {
            params: Joi.object({
                partyType: Joi.string().valid(...partyTypes)
            }),
            options: { abortEarly: false },
            payload: Joi.object({
                property: Joi.string().regex(ADDRESS_REGEX),
                street: Joi.string().regex(ADDRESS_REGEX),
                town: Joi.string().regex(ADDRESS_REGEX)
            }),
            failAction: (request, h, err) => {
                const appData = getAppData(request);
                const pageData = { 
                    partyType: request.params.partyType, 
                    isAgent: appData?.isAgent, 
                    permitType: appData?.permitType, 
                    ...request.payload 
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const partyType = request.params.partyType

            const appData = {
                [partyType]: {
                    addressSearchData: {
                        property: request.payload.property,
                        street: request.payload.street,                        
                        town: request.payload.town,
                        postcode: null
                    }
                }
            }

            try {
                setAppData(request, appData, `${pageId}/${partyType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(`${nextPath}/${partyType}`)
        }
    },
}]