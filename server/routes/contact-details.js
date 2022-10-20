const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../helpers/helper-functions')
const { getAppData, setAppData, clearAppData } = require('../helpers/session')
const { NAME_REGEX, BUSINESSNAME_REGEX } = require('../helpers/regex-validation')
const textContent = require('../content/text-content')
const viewTemplate = 'contact-details'
const currentPath = `${urlPrefix}/${viewTemplate}`
const previousPath = `${urlPrefix}/agent`
const partyTypes = ['agent', 'applicant']
const nextPath = `${urlPrefix}/postcode`
const invalidAppDataPath = urlPrefix


function createModel(errorList, data) {
    const commonContent = textContent.common;
    const pageContent = data.partyType === 'agent' ? textContent.contactDetailsAgent : textContent.contactDetailsApplicant;

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

function validateAppData(appData, partyType){
    if(appData.isAgent === null){ return false; }
    if(appData.isAgent === false && partyType === 'agent'){ return false; }
    return true;
}

module.exports = [{
    method: 'GET',
    path: `${currentPath}/{partyType}`,
    handler: async (request, h) => {
        const appData = getAppData(request);

        if(!validateAppData(appData, request.params.partyType)){
            return h.redirect(`${invalidAppDataPath}/`)
        }

        const pageData =
            request.params.partyType === 'agent' ?
                {
                    fullName: appData.agentFullName,
                    businessName: appData.agentBusinessName,
                    email: appData.agentEmail,

                } : {
                    fullName: appData.applicantFullName,
                    businessName: appData.applicantBusinessName,
                    email: appData.applicantEmail,
                }
        return h.view(viewTemplate, createModel(null, { partyType: request.params.partyType, ...pageData }));
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
                const errorList = []
                const fields = ['fullName', 'businessName', 'email']
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
                return h.view(viewTemplate, createModel(errorList, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const { fullName, businessName, email } = request.payload
            const contactDetails = request.params.partyType === 'agent' ?
                {
                    agentFullName: fullName,
                    agentBusinessName: businessName,
                    agentEmail: email,

                } : {
                    applicantFullName: fullName,
                    applicantBusinessName: businessName,
                    applicantEmail: email,
                }

            const appData = setAppData(request, contactDetails)
            if(!validateAppData(appData, request.params.partyType)){
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(`${nextPath}/${request.params.partyType}`)
        }
    },
}
]