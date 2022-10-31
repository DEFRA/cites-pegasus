const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../helpers/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../helpers/app-data')
const { POSTCODE_REGEX } = require('../helpers/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'postcode'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/contact-details`
const partyTypes = ['agent', 'applicant']//If these change then change back link logic
const nextPath = `${urlPrefix}/select-address`
const invalidAppDataPath = urlPrefix


function createModel(errorList, data) {
    const commonContent = textContent.common;
    const pageContent = textContent.postcode;

    const model = {
        backLink: `${previousPath}/${data.partyType}`,
        pageHeader: pageContent.pageHeader,
        formActionPage: `${currentPath}/${data.partyType}`,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
        linkText: pageContent.linkUnknownPostcode,
        linkUrl: `/search-address/${data.partyType}`,
        inputPostcode: {
            label: {
                text: pageContent.inputLabelPostcode
            },
            id: "postcode",
            name: "postcode",
            classes: "govuk-!-width-two-thirds",
            ...(data.postcode ? { value: data.postcode } : {}),
            errorMessage: getFieldError(errorList, '#postcode')
        },
    }
    return { ...commonContent, ...model }
}

module.exports = [{
    method: 'GET',
    path: `${currentPath}/{partyType}`,
    handler: async (request, h) => {
        const appData = getAppData(request);

        try {
            validateAppData(appData, `${pageId}/${request.params.partyType}`)
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
        }

        return h.view(pageId, createModel(null, { partyType: request.params.partyType, postcode: appData[request.params.partyType].addressSearchData?.postcode }));
    },
    options: {
        validate: {
            params: Joi.object({
                partyType: Joi.string().valid(...partyTypes)
            })

        }
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
                postcode: Joi.string().regex(POSTCODE_REGEX).required()
            }),
            failAction: (request, h, err) => {
                const errorList = []
                const fields = ['postcode']
                fields.forEach(field => {
                    const fieldError = findErrorList(err, [field])[0]
                    if (fieldError) {
                        errorList.push({
                            text: fieldError,
                            href: `#${field}`
                        })
                    }
                })

                const pageData = { partyType: request.params.partyType, ...request.payload }
                return h.view(pageId, createModel(errorList, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const partyType = request.params.partyType


            const address = {
                [partyType]: {
                    address: null,
                    addressSearchData: {
                        property: null,
                        street: null,                        
                        postcode: request.payload.postcode
                    }
                }
            }

            try {
                setAppData(request, address, `${pageId}/${partyType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(`${nextPath}/${partyType}`)
        }
    },
}]