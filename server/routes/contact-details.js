const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../helpers/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../helpers/app-data')
const { NAME_REGEX, BUSINESSNAME_REGEX } = require('../helpers/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'contact-details'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/agent`
const partyTypes = ['agent', 'applicant']
const nextPath = `${urlPrefix}/postcode`
const invalidAppDataPath = urlPrefix


function createModel(errors, data) {
    const commonContent = textContent.common;
    
    let pageContent = null
    if(data.partyType === 'applicant'){
        if(data.isAgent){
            pageContent = textContent.contactDetails.agentLed
        } else {
            pageContent = textContent.contactDetails.applicant
        }
    } else {
        pageContent = textContent.contactDetails.agent
    }

    let errorList = null
    if(errors){
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
        const fields = ['fullName', 'businessName', 'email']
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
        backLink: previousPath,
        pageHeader: pageContent.pageHeader,
        formActionPage: `${currentPath}/${data.partyType}`,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,

        inputFullName: {
            label: {
                text: pageContent.inputLabelFullName
            },
            id: "fullName",
            name: "fullName",
            classes: "govuk-!-width-two-thirds",
            ...(data.fullName ? { value: data.fullName } : {}),
            errorMessage: getFieldError(errorList, '#fullName')
        },

        inputBusinessName: {
            label: {
                text: pageContent.inputLabelBusinessName,
            },
            hint: {
                text: pageContent.inputHintBusinessName
            },
            id: "businessName",
            name: "businessName",
            classes: "govuk-!-width-two-thirds",
            ...(data.businessName ? { value: data.businessName } : {}),
            errorMessage: getFieldError(errorList, '#businessName')
        },

        inputEmail: {
            label: {
                text: pageContent.inputLabelEmail,
            },
            hint: {
                text: pageContent.inputHintEmail
            },
            id: "email",
            name: "email",
            classes: "govuk-!-width-two-thirds",
            ...(data.email ? { value: data.email } : {}),
            errorMessage: getFieldError(errorList, '#email')
        }
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
        const pageData = { 
            partyType: request.params.partyType, 
            isAgent: appData?.isAgent, 
            ...appData[request.params.partyType] 
        }

        return h.view(pageId, createModel(null, pageData));
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
                fullName: Joi.string().regex(NAME_REGEX).required(),
                businessName: Joi.string().regex(BUSINESSNAME_REGEX).allow(""),
                email: Joi.string().email().allow("")
            }),
            failAction: (request, h, err) => {
                const appData = getAppData(request);
                const pageData = { 
                    partyType: request.params.partyType, 
                    isAgent: appData?.isAgent, 
                    ...request.payload 
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const { fullName, businessName, email } = request.payload
            const contactDetails = {
                [request.params.partyType]: {
                    fullName: fullName,
                    businessName: businessName,
                    email: email
                }
            }

            try {
                setAppData(request, contactDetails, `${pageId}/${request.params.partyType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(`${nextPath}/${request.params.partyType}`)
        }
    },
}]