const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getAppData, mergeAppData, validateAppData } = require('../lib/app-data')
const { NAME_REGEX, BUSINESSNAME_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'contact-details'
const currentPath = `${urlPrefix}/${pageId}`
const contactTypes = ['agent', 'applicant']
const nextPath = `${urlPrefix}/postcode`
const invalidAppDataPath = urlPrefix


function createModel(errors, data) {
    const commonContent = textContent.common;
    
    let pageContent = null
    if(data.contactType === 'applicant'){
        if(data.isAgent){
            pageContent = textContent.contactDetails.agentLed
        } else {
            pageContent = textContent.contactDetails.applicant
        }
    } else {
        pageContent = textContent.contactDetails.agent
    }

    let previousPath = data.contactType === 'applicant' && data.isAgent ? `${urlPrefix}/confirm-address/agent` : `${urlPrefix}/applying-on-behalf`

    let defaultTitle = ''
    let pageHeader = ''

    switch (data.permitType) {
        case 'import':
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            inputHintBusinessName = pageContent.inputHintBusinessNameImport
            inputHintEmail = pageContent.inputHintEmailImport
            break;
        case 'export':
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            inputHintBusinessName = pageContent.inputHintBusinessNameExport
            inputHintEmail = pageContent.inputHintEmailExport
            break;
        case 'reexport':
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            inputHintBusinessName = pageContent.inputHintBusinessNameReexport
            inputHintEmail = pageContent.inputHintEmailReexport
            break;
        case 'article10':
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
            inputHintBusinessName = pageContent.inputHintBusinessNameArticle10
            inputHintEmail = pageContent.inputHintEmailArticle10
            break;
    }

    let errorList = null
    if(errors){
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...textContent.contactDetails.errorMessages, ...pageContent.errorMessages }
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
        pageHeader: pageHeader,
        formActionPage: `${currentPath}/${data.contactType}`,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : defaultTitle,

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
                text: inputHintBusinessName
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
                text: inputHintEmail
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
    path: `${currentPath}/{contactType}`,
    handler: async (request, h) => {
        const appData = getAppData(request);

        try {
            validateAppData(appData, `${pageId}/${request.params.contactType}`)
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
        }
        const pageData = { 
            contactType: request.params.contactType, 
            isAgent: appData?.isAgent, 
            permitType: appData?.permitType,
            ...appData[request.params.contactType] 
        }

        return h.view(pageId, createModel(null, pageData));
    },
    options: {
        validate: {
            params: Joi.object({
                contactType: Joi.string().valid(...contactTypes)
            })

        }
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
            options: { abortEarly: false },
            payload: Joi.object({
                fullName: Joi.string().regex(NAME_REGEX).required(),
                businessName: Joi.string().regex(BUSINESSNAME_REGEX).allow(""),
                email: Joi.string().email().allow("")
            }),
            failAction: (request, h, err) => {
                const appData = getAppData(request);
                const pageData = { 
                    contactType: request.params.contactType, 
                    isAgent: appData?.isAgent, 
                    permitType: appData?.permitType,
                    ...request.payload 
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const { fullName, businessName, email } = request.payload
            const contactDetails = {
                [request.params.contactType]: {
                    fullName: fullName.trim(),
                    businessName: businessName.trim(),
                    email: email.trim()
                }
            }

            try {
                mergeAppData(request, contactDetails, `${pageId}/${request.params.contactType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(`${nextPath}/${request.params.contactType}`)
        }
    },
}]