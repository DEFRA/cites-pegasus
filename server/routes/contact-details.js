const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const { NAME_REGEX, BUSINESSNAME_REGEX } = require('../lib/regex-validation')
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require('../content/text-content')
const { getYarValue } = require('../lib/session')
const pageId = 'contact-details'
const currentPath = `${urlPrefix}/${pageId}`
const contactTypes = ['agent', 'applicant']
const nextPath = `${urlPrefix}/postcode`
const invalidSubmissionPath = urlPrefix


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
        const submission = getSubmission(request);

        try {
            validateSubmission(submission, `${pageId}/${request.params.contactType}`)
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidSubmissionPath}/`)
        }

        let email, fullName, businessName

        //= submission[request.params.contactType] 

        if (submission[request.params.contactType]) {
            email = submission[request.params.contactType].email
            fullName = submission[request.params.contactType].fullName
            businessName = submission[request.params.contactType].businessName
        } else {
            if ((request.params.contactType === 'applicant' && !submission?.isAgent)
                || (request.params.contactType === 'agent' && submission?.isAgent)) {

                //get applicant details from auth credentials
                const { user } = getYarValue(request, 'CIDMAuth')

                email = user.email
                fullName = user.firstName + ' ' + user.lastName
                businessName = user.organisation
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
                businessName: Joi.string().max(150).regex(BUSINESSNAME_REGEX).allow(""),
                email: Joi.string().max(150).email().allow("")
            }),
            failAction: (request, h, err) => {
                const submission = getSubmission(request);
                const pageData = {
                    backLinkOverride: checkChangeRouteExit(request, true),
                    contactType: request.params.contactType,
                    isAgent: submission?.isAgent,
                    permitType: submission?.permitType,
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
                mergeSubmission(request, contactDetails, `${pageId}/${request.params.contactType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidSubmissionPath}/`)
            }

            const exitChangeRouteUrl = checkChangeRouteExit(request, false)
            if (exitChangeRouteUrl) {
                return h.redirect(exitChangeRouteUrl)
            }

            return h.redirect(`${nextPath}/${request.params.contactType}`)
        }
    },
}]