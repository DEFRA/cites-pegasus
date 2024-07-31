const Joi = require('joi')
const { urlPrefix, enableDeliveryName } = require("../../config/config")
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { govukClass } = require("../lib/constants")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { ADDRESS_REGEX, TOWN_COUNTY_REGEX, POSTCODE_REGEX } = require('../lib/regex-validation')
const { permitType: pt } = require('../lib/permit-type-helper')
const textContent = require('../content/text-content')
const pageId = 'enter-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/postcode`
const contactTypes = ['applicant', 'delivery']
const nextPath = `${urlPrefix}/confirm-address`
const invalidSubmissionPath = `${urlPrefix}/`
const lodash = require('lodash')
const { func } = require('@hapi/joi')

function createModel(errors, data) {
    const commonContent = textContent.common;

    const enterAddressText = lodash.cloneDeep(textContent.enterAddress) //Need to clone the source of the text content so that the merge below doesn't affect other pages.
    const pageContent = getPageContent(data, enterAddressText)
    const { defaultTitle, pageHeader, pageBody } = getPermitSpecificContent(pageContent, data.permitType)
    const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['deliveryName', 'addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'postcode', 'country'])

    const model = {
        backLink: `${previousPath}/${data.contactType}`,
        pageHeader: pageHeader,
        pageBody: pageBody,
        formActionPage: `${currentPath}/${data.contactType}`,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : defaultTitle + commonContent.pageTitleSuffix,
        internationalAddress: data.contactType !== 'delivery',
        showDeliveryName: data.contactType === 'delivery' && enableDeliveryName,
        ...getInputs(errorList, data, pageContent, commonContent)
    }
    return { ...commonContent, ...model }
}

function getInputs(errorList, data, pageContent, commonContent) {
    return {
        inputDeliveryName: {
            label: {
                text: pageContent.inputLabelDeliveryName
            },
            hint: {
                text: pageContent.inputHintDeliveryName
            },
            id: "deliveryName",
            name: "deliveryName",
            autocomplete: "name",
            ...(data.deliveryName ? { value: data.deliveryName } : {}),
            errorMessage: getFieldError(errorList, '#deliveryName')
        },
        inputAddressLine1: {
            label: {
                text: pageContent.inputLabelAddressLine1
            },
            id: "addressLine1",
            name: "addressLine1",
            autocomplete: "address-line1",
            ...(data.addressLine1 ? { value: data.addressLine1 } : {}),
            errorMessage: getFieldError(errorList, '#addressLine1')
        },
        inputAddressLine2: {
            label: {
                text: pageContent.inputLabelAddressLine2
            },
            id: "addressLine2",
            name: "addressLine2",
            autocomplete: "address-line2",
            ...(data.addressLine2 ? { value: data.addressLine2 } : {}),
            errorMessage: getFieldError(errorList, '#addressLine2')
        },
        inputAddressLine3: {
            label: {
                text: pageContent.inputLabelAddressLine3
            },
            id: "addressLine3",
            name: "addressLine3",
            autocomplete: "address-line3",
            classes: govukClass.WIDTH_TWO_THIRDS,
            ...(data.addressLine3 ? { value: data.addressLine3 } : {}),
            errorMessage: getFieldError(errorList, '#addressLine3')
        },
        inputAddressLine4: {
            label: {
                text: pageContent.inputLabelAddressLine4
            },
            id: "addressLine4",
            name: "addressLine4",
            classes: govukClass.WIDTH_TWO_THIRDS,
            ...(data.addressLine4 ? { value: data.addressLine4 } : {}),
            errorMessage: getFieldError(errorList, '#addressLine4')
        },
        inputPostcode: {
            label: {
                text: pageContent.inputLabelPostcode
            },
            id: "postcode",
            name: "postcode",
            classes: "govuk-input--width-10",
            autocomplete: "postal-code",
            ...(data.postcode ? { value: data.postcode } : {}),
            errorMessage: getFieldError(errorList, '#postcode')
        },
        selectCountry: {
            label: {
                text: pageContent.inputLabelCountry
            },
            id: "country",
            name: "country",
            classes: govukClass.WIDTH_TWO_THIRDS,
            items: getCountries(data, commonContent),
            errorMessage: getFieldError(errorList, '#country')
        }
    }
}

function getCountries(data, commonContent) {

    const countries = [{
        text: commonContent.countrySelectDefault,
        value: '',
        selected: false
    }]

    countries.push(...data.countries.map(country => {
        return {
            text: country.name,
            value: country.code,
            selected: country.code === (data.country || '')
        }
    }))
    
    return countries
}

function getPageContent(data, enterAddressText) {
    if (data.contactType === 'applicant') {
        if (data.isAgent) {
            return lodash.merge(enterAddressText.common, enterAddressText.agentLed)
        } else {
            return lodash.merge(enterAddressText.common, enterAddressText.applicant)
        }
    } else if (data.contactType === 'agent') {
        return lodash.merge(enterAddressText.common, enterAddressText.agent)
    } else {
        return lodash.merge(enterAddressText.common, enterAddressText.delivery)
    }
}

function getPermitSpecificContent(pageContent, permitType) {
    let defaultTitle = ''
    let pageHeader = ''
    let pageBody = ''

    switch (permitType) {
        case pt.IMPORT:
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            pageBody = pageContent.pageBodyImport
            break
        case pt.EXPORT:
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            pageBody = pageContent.pageBodyExport
            break
        case pt.MIC:
        case pt.TEC:
        case pt.POC:
        case pt.REEXPORT:
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            pageBody = pageContent.pageBodyReexport
            break
        case pt.ARTICLE_10:
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
            pageBody = pageContent.pageBodyArticle10
            break
        default:
            throw new Error(`Unknown permit type: ${permitType}`)
    }
    return { defaultTitle, pageHeader, pageBody }
}

module.exports = [{
    method: 'GET',
    path: `${currentPath}/{contactType}`,
    options: {
        validate: {
            params: Joi.object({
                contactType: Joi.string().valid(...contactTypes)
            }),
            failAction: (request, h, error) => {
                console.log(error)
            }
        }
    },
    handler: async (request, h) => {
        const submission = getSubmission(request);

        try {
            validateSubmission(submission, `${pageId}/${request.params.contactType}`)
        }
        catch (err) {
            console.error(err);
            return h.redirect(invalidSubmissionPath)
        }

        const pageData = {
            contactType: request.params.contactType,
            isAgent: submission?.isAgent,
            permitType: submission?.permitType,
            countries: request.server.app.countries,
            ...submission[request.params.contactType]?.candidateAddressData?.selectedAddress
        }


        return h.view(pageId, createModel(null, pageData));
    }
},
{
    method: 'POST',
    path: `${currentPath}/{contactType}`,
    options: {
        validate: {
            params: Joi.object({
                contactType: Joi.string().valid(...contactTypes)
            }),
            //Payload validation done in handler section as contactType can't be accessed here
        },
        handler: async (request, h) => {
            const contactType = request.params.contactType
            const ukAddressSchema = Joi.object({
                deliveryName: Joi.string().max(150).regex(ADDRESS_REGEX).optional().allow('', null),
                addressLine1: Joi.string().max(150).regex(ADDRESS_REGEX),
                addressLine2: Joi.string().max(150).regex(ADDRESS_REGEX).optional().allow('', null),
                addressLine3: Joi.string().max(150).regex(TOWN_COUNTY_REGEX),
                addressLine4: Joi.string().max(150).regex(TOWN_COUNTY_REGEX).optional().allow('', null),
                postcode: Joi.string().max(50).regex(POSTCODE_REGEX)
            })

            const internationalAddressSchema = Joi.object({
                addressLine1: Joi.string().max(150).required(),
                addressLine2: Joi.string().max(150).required(),
                addressLine3: Joi.string().max(150).optional().allow('', null),
                addressLine4: Joi.string().max(150).optional().allow('', null),
                postcode: Joi.string().max(50).optional().allow('', null),
                country: Joi.string().required().max(150)
            })

            const payloadSchema = contactType === 'delivery' ? ukAddressSchema : internationalAddressSchema

            const result = payloadSchema.validate(request.payload, { abortEarly: false })

            if (result.error) {
                const submission = getSubmission(request);
                const pageData = {
                    contactType: request.params.contactType,
                    isAgent: submission?.isAgent,
                    permitType: submission?.permitType,
                    countries: request.server.app.countries,
                    ...request.payload
                }

                return h.view(pageId, createModel(result.error, pageData)).takeover()
            }

            const selectedCountry = request.server.app.countries.find(country => country.code === (request.payload.country || 'UK'))

            const newSubmission = {
                [contactType]: {
                    candidateAddressData: {
                        selectedAddress: {
                            deliveryName: request.payload.deliveryName?.trim(),
                            addressLine1: request.payload.addressLine1.trim(),
                            addressLine2: request.payload.addressLine2.trim(),
                            addressLine3: request.payload.addressLine3.trim(),
                            addressLine4: request.payload.addressLine4.trim(),
                            postcode: request.payload.postcode.trim(),
                            country: selectedCountry.code,
                            countryDesc: selectedCountry.name,
                            uprn: null
                        }
                    }
                }
            }

            if (contactType === "delivery") {
                newSubmission[contactType].addressOption = "different"
            }

            try {
                mergeSubmission(request, newSubmission, `${pageId}/${contactType}`)
            }
            catch (err) {
                console.error(err);
                return h.redirect(invalidSubmissionPath)
            }
            const redirectTo = `${nextPath}/${contactType}`
            saveDraftSubmission(request, redirectTo)
            return h.redirect(redirectTo)

        }
    },
}
]