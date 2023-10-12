const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { NAME_REGEX, BUSINESSNAME_REGEX } = require('../lib/regex-validation')
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require('../content/text-content')
const { getYarValue } = require('../lib/session')
const pageId = 'contact-details'
const currentPath = `${urlPrefix}/${pageId}`
const contactTypes = ['applicant']
const nextPath = `${urlPrefix}/postcode`
const invalidSubmissionPath = `${urlPrefix}/`


function createModel(errors, data) {
    const commonContent = textContent.common;

    let pageContent = null
    if (data.contactType === 'applicant') {
        if (data.isAgent) {
            pageContent = textContent.contactDetails.agentLed
        } else {
            pageContent = textContent.contactDetails.applicant
        }
    } else {
        pageContent = textContent.contactDetails.agent
    }

    let previousPath = `${urlPrefix}/applying-on-behalf`

    let defaultTitle = ''
    let pageHeader = ''
    let inputHintEmail = ''

    switch (data.permitType) {
        case 'import':
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            inputHintEmail = pageContent.inputHintEmailImport
            break;
        case 'export':
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            inputHintEmail = pageContent.inputHintEmailExport
            break;
        case 'reexport':
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            inputHintEmail = pageContent.inputHintEmailReexport
            break;
        case 'article10':
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
            inputHintEmail = pageContent.inputHintEmailArticle10
            break;
    }

    let errorList = null
    if (errors) {
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

    const backLink = data.backLinkOverride ? data.backLinkOverride : previousPath

    const model = {
        backLink: backLink,
        pageHeader: pageHeader,
        inputLabelBusinessName: pageContent.inputLabelBusinessName,
        businessNameValue: data.businessName,
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
            autocomplete: "name",
            ...(data.fullName ? { value: data.fullName } : {}),
            errorMessage: getFieldError(errorList, '#fullName')
        },

        // inputBusinessName: {
        //     label: {
        //         text: pageContent.inputLabelBusinessName,
        //     },
        //     hint: {
        //         text: inputHintBusinessName
        //     },
        //     id: "businessName",
        //     name: "businessName",
        //     autocomplete: "on",
        //     classes: "govuk-!-width-two-thirds disabled",
        //     ...(data.businessName ? { value: data.businessName } : {}),
        //     errorMessage: getFieldError(errorList, '#businessName')
        // },

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
            autocomplete: "email",
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
        const submission = getSubmission(request);

        try {
            validateSubmission(submission, `${pageId}/${request.params.contactType}`)
        }
        catch (err) {
            console.error(err);
            return h.redirect(invalidSubmissionPath)
        }

        let email, fullName, businessName

        //= submission[request.params.contactType] 

        if (submission[request.params.contactType]) {
            email = submission[request.params.contactType].email
            fullName = submission[request.params.contactType].fullName
            businessName = submission[request.params.contactType].businessName
        } else {
            const { user } = getYarValue(request, 'CIDMAuth')
            businessName = user.organisationName

            if ((request.params.contactType === 'applicant' && !submission?.isAgent)
                || (request.params.contactType === 'agent' && submission?.isAgent)) {

                //get applicant details from auth credentials

                email = user.email
                fullName = user.firstName + ' ' + user.lastName
            }
        }
        const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            contactType: request.params.contactType,
            isAgent: submission?.isAgent,
            permitType: submission?.permitType,
            email: email,
            fullName: fullName,
            businessName: businessName
            //...submission[request.params.contactType] 
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
                fullName: Joi.string().max(150).regex(NAME_REGEX).required(),
                email: Joi.string().max(150).email().allow("")
            }),
            failAction: (request, h, err) => {
                const submission = getSubmission(request);
                
                let businessName
                if (submission[request.params.contactType]) {
                    businessName = submission[request.params.contactType].businessName
                } else {
                    const { user } = getYarValue(request, 'CIDMAuth')
                    businessName = user.organisationName
                }

                const pageData = {
                    backLinkOverride: checkChangeRouteExit(request, true),
                    contactType: request.params.contactType,
                    isAgent: submission?.isAgent,
                    permitType: submission?.permitType,
                    businessName,
                    ...request.payload
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const { fullName, email } = request.payload
            
            const submission = getSubmission(request)
            
            let businessName
            if (submission[request.params.contactType]) {
                businessName = submission[request.params.contactType].businessName
            } else {
                const { user } = getYarValue(request, 'CIDMAuth')
                businessName = user.organisationName
            }

            const contactDetails = {
                [request.params.contactType]: {
                    fullName: fullName.trim(),
                    businessName: businessName.trim(),
                    email: email.trim()
                }
            }

            try {
                mergeSubmission(request, contactDetails, `${pageId}/${request.params.contactType}`)
            }
            catch (err) {
                console.error(err);
                return h.redirect(invalidSubmissionPath)
            }

            let redirectTo = `${nextPath}/${request.params.contactType}`
            const exitChangeRouteUrl = checkChangeRouteExit(request, false)

            if (exitChangeRouteUrl) {
                redirectTo = exitChangeRouteUrl
            }

            saveDraftSubmission(request, redirectTo)
            return h.redirect(redirectTo)      
        }
    },
}]