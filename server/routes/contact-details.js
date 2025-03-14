const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { stringLength } = require('../lib/constants')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { permitType: pt } = require('../lib/permit-type-helper')
const { NAME_REGEX } = require('../lib/regex-validation')
const { checkChangeRouteExit } = require('../lib/change-route')
const textContent = require('../content/text-content')
const { getYarValue, sessionKey } = require('../lib/session')
const pageId = 'contact-details'
const currentPath = `${urlPrefix}/${pageId}`
const contactTypes = ['applicant']
const nextPath = `${urlPrefix}/postcode`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel (errors, data) {
  const commonContent = textContent.common

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

  const previousPath = `${urlPrefix}/applying-on-behalf`

  const { defaultTitle, pageHeader, inputHintEmail } = getPermitSpecificContent(pageContent, data.permitType)
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...textContent.contactDetails.errorMessages, ...pageContent.errorMessages }, ['fullName', 'businessName', 'email'])

  const backLink = data.backLinkOverride ? data.backLinkOverride : previousPath

  const model = {
    backLink: backLink,
    pageHeader: pageHeader,
    pageBody: pageContent.pageBody,
    inputLabelBusinessName: pageContent.inputLabelBusinessName,
    businessNameValue: data.businessName,
    isAgent: data.isAgent,
    formActionPage: `${currentPath}/${data.contactType}`,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : defaultTitle + commonContent.pageTitleSuffix,

    inputFullName: {
      label: {
        text: pageContent.inputLabelFullName
      },
      id: 'fullName',
      name: 'fullName',
      classes: 'govuk-!-width-two-thirds',
      autocomplete: 'name',
      ...(data.fullName ? { value: data.fullName } : {}),
      errorMessage: getFieldError(errorList, '#fullName')
    },

    inputEmail: {
      label: {
        text: pageContent.inputLabelEmail
      },
      hint: {
        text: inputHintEmail
      },
      id: 'email',
      name: 'email',
      classes: 'govuk-!-width-two-thirds',
      autocomplete: 'email',
      ...(data.email ? { value: data.email } : {}),
      errorMessage: getFieldError(errorList, '#email')
    }
  }
  return { ...commonContent, ...model }
}

function getPermitSpecificContent (pageContent, permitType) {
  let defaultTitle
  let pageHeader
  let inputHintEmail

  switch (permitType) {
    case pt.IMPORT:
      defaultTitle = pageContent.defaultTitleImport
      pageHeader = pageContent.pageHeaderImport
      inputHintEmail = pageContent.inputHintEmailImport
      break
    case pt.EXPORT:
      defaultTitle = pageContent.defaultTitleExport
      pageHeader = pageContent.pageHeaderExport
      inputHintEmail = pageContent.inputHintEmailExport
      break
    case pt.MIC:
    case pt.TEC:
    case pt.POC:
    case pt.REEXPORT:
      defaultTitle = pageContent.defaultTitleReexport
      pageHeader = pageContent.pageHeaderReexport
      inputHintEmail = pageContent.inputHintEmailReexport
      break
    case pt.ARTICLE_10:
      defaultTitle = pageContent.defaultTitleArticle10
      pageHeader = pageContent.pageHeaderArticle10
      inputHintEmail = pageContent.inputHintEmailArticle10
      break
    default:
      throw new Error(`Unknown permit type: ${permitType}`)
  }
  return { defaultTitle, pageHeader, inputHintEmail }
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}/{contactType}`,
  handler: async (request, h) => {
    const submission = getSubmission(request)

    try {
      validateSubmission(submission, `${pageId}/${request.params.contactType}`)
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }

    let email, fullName, businessName

    //= submission[request.params.contactType]

    if (submission[request.params.contactType]) {
      email = submission[request.params.contactType].email
      fullName = submission[request.params.contactType].fullName
      businessName = submission[request.params.contactType].businessName
    } else {
      const { user } = getYarValue(request, sessionKey.CIDM_AUTH)
      businessName = user.organisationName

      if ((request.params.contactType === 'applicant' && !submission?.isAgent) ||
                (request.params.contactType === 'agent' && submission?.isAgent)) {
        // get applicant details from auth credentials

        email = user.email
        fullName = `${user.firstName} ${user.lastName}`
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
      // ...submission[request.params.contactType]
    }

    return h.view(pageId, createModel(null, pageData))
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
        fullName: Joi.string().max(stringLength.max150).regex(NAME_REGEX).required(),
        email: Joi.string().max(stringLength.max150).email().allow('')
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)

        let businessName
        if (submission[request.params.contactType]) {
          businessName = submission[request.params.contactType].businessName
        } else {
          const { user } = getYarValue(request, sessionKey.CIDM_AUTH)
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
        const { user } = getYarValue(request, sessionKey.CIDM_AUTH)
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
      } catch (err) {
        console.error(err)
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
  }
}]
