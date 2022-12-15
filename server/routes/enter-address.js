const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../lib/app-data')
const { ADDRESS_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'enter-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/postcode`
const partyTypes = ['agent', 'applicant']
const nextPath = `${urlPrefix}/confirm-address`
const invalidAppDataPath = urlPrefix


function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    if (data.partyType === 'applicant') {
        if (data.isAgent) {
            pageContent = textContent.enterAddress.agentLed
        } else {
            pageContent = textContent.enterAddress.applicant
        }
    } else {
        pageContent = textContent.enterAddress.agent
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
    if (errors) {
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...errorMessages }
        const fields = ['addressLine1', 'town', 'postcode']
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

        inputAddressLine1: {
            label: {
                text: pageContent.inputLabelAddressLine1
            },
            id: "addressLine1",
            name: "addressLine1",
            ...(data.addressLine1 ? { value: data.addressLine1 } : {}),
            errorMessage: getFieldError(errorList, '#addressLine1')
        },
        inputAddressLine2: {
            label: {
                text: pageContent.inputLabelAddressLine2
            },
            id: "addressLine2",
            name: "addressLine2",
            ...(data.addressLine2 ? { value: data.addressLine2 } : {}),
            errorMessage: getFieldError(errorList, '#addressLine2')
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
        },
        inputCounty: {
            label: {
                text: pageContent.inputLabelCounty
            },
            id: "county",
            name: "county",
            classes: "govuk-!-width-two-thirds",
            ...(data.county ? { value: data.county } : {}),
            errorMessage: getFieldError(errorList, '#county')
        },
        inputPostcode: {
            label: {
                text: pageContent.inputLabelPostcode
            },
            id: "postcode",
            name: "postcode",
            classes: "govuk-input--width-10",
            ...(data.postcode ? { value: data.postcode } : {}),
            errorMessage: getFieldError(errorList, '#postcode')
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
            ...appData[request.params.partyType].address 
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
                addressLine1: Joi.string().regex(ADDRESS_REGEX),
                addressLine2: Joi.string().regex(ADDRESS_REGEX).optional().allow('',null),
                town: Joi.string().regex(ADDRESS_REGEX),
                county: Joi.string().regex(ADDRESS_REGEX).optional().allow('',null),
                postcode: Joi.string().regex(ADDRESS_REGEX)
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
                    address: {
                        addressLine1: request.payload.addressLine1.trim(),
                        addressLine2: request.payload.addressLine2.trim(),
                        town: request.payload.town.trim(),
                        county: request.payload.county.trim(),
                        postcode: request.payload.postcode.trim(),
                        uprn: null
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
}
]