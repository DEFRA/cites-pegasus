const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { ADDRESS_REGEX, TOWN_COUNTY_REGEX, POSTCODE_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'enter-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/postcode`
const contactTypes = ['applicant', 'delivery']
const nextPath = `${urlPrefix}/confirm-address`
const invalidSubmissionPath = `${urlPrefix}/`
const lodash = require('lodash')

function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    const enterAddressText = lodash.cloneDeep(textContent.enterAddress) //Need to clone the source of the text content so that the merge below doesn't affect other pages.

    if (data.contactType === 'applicant') {
        if (data.isAgent) {
            pageContent = lodash.merge(enterAddressText.common, enterAddressText.agentLed)
        } else {
            pageContent = lodash.merge(enterAddressText.common, enterAddressText.applicant)
        }
    } else if (data.contactType === 'agent') {
        pageContent = lodash.merge(enterAddressText.common, enterAddressText.agent)
    } else {
        pageContent = lodash.merge(enterAddressText.common, enterAddressText.delivery)
    }

    let defaultTitle = ''
    let pageHeader = ''
    let pageBody = ''
    let errorMessages = pageContent.errorMessages

    switch (data.permitType) {
        case 'import':
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            pageBody = pageContent.pageBodyImport
            break;
        case 'export':
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            pageBody = pageContent.pageBodyExport
            break;
        case 'reexport':
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            pageBody = pageContent.pageBodyReexport
            break;
        case 'article10':
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
            pageBody = pageContent.pageBodyArticle10
            break;
    }

    let errorList = null
    if (errors) {
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages, ...errorMessages }
        const fields = ['addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'postcode', 'country']
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

    const model = {
        backLink: `${previousPath}/${data.contactType}`,
        pageHeader: pageHeader,
        pageBody: pageBody,
        formActionPage: `${currentPath}/${data.contactType}`,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : defaultTitle,
        internationalAddress: data.contactType !== 'delivery',
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
            classes: "govuk-!-width-two-thirds",
            ...(data.addressLine3 ? { value: data.addressLine3 } : {}),
            errorMessage: getFieldError(errorList, '#addressLine3')
        },
        inputAddressLine4: {
            label: {
                text: pageContent.inputLabelAddressLine4
            },
            id: "addressLine4",
            name: "addressLine4",
            classes: "govuk-!-width-two-thirds",
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
            classes: "govuk-!-width-two-thirds",
            items: countries,
            errorMessage: getFieldError(errorList, '#country')
        }
    }
    return { ...commonContent, ...model }
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