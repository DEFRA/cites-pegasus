const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { permitType: pt } = require('../lib/permit-type-helper')
const { POSTCODE_REGEX } = require('../lib/regex-validation')
const { checkChangeRouteExit } = require('../lib/change-route')
const textContent = require('../content/text-content')
const pageId = 'postcode'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathContactDetails = `${urlPrefix}/contact-details`
const previousPathSelectDeliveryAddress = `${urlPrefix}/select-delivery-address`
const contactTypes = ['agent', 'applicant', 'delivery']
const nextPath = `${urlPrefix}/select-address`
const invalidSubmissionPath = `${urlPrefix}/`
const lodash = require('lodash')

function createModel (errors, data) {
  const commonContent = textContent.common

  const { pageContent, defaultBackLink } = getPageContentAndBackLink(data)

  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBackLink

  const { defaultTitle, pageHeader, errorMessages } = getPermitSpecificContent(pageContent, data.permitType)

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages, ...errorMessages }, ['postcode'])

  const model = {
    backLink: backLink,
    pageHeader: pageHeader,
    containerClasses: 'hide-when-loading',
    formActionPage: `${currentPath}/${data.contactType}`,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : defaultTitle + commonContent.pageTitleSuffix,
    linkTextEnterAddress: pageContent.linkTextEnterAddress,
    linkUrlEnterAddress: `/enter-address/${data.contactType}`,
    buttonFindAddress: pageContent.buttonFindAddress,
    inputPostcode: {
      label: {
        text: pageContent.inputLabelPostcode
      },
      id: 'postcode',
      name: 'postcode',
      classes: 'govuk-!-width-two-thirds',
      autocomplete: 'postal-code',
      attributes: { maxlength: 8 },
      ...(data.postcode ? { value: data.postcode } : {}),
      errorMessage: getFieldError(errorList, '#postcode')
    }
  }

  return { ...commonContent, ...model }
}

function getPermitSpecificContent (pageContent, permitType) {
  let defaultTitle = ''
  let pageHeader = ''
  let errorMessages = null

  switch (permitType) {
    case pt.IMPORT:
      defaultTitle = pageContent.defaultTitleImport
      pageHeader = pageContent.pageHeaderImport
      errorMessages = pageContent.errorMessagesImport
      break
    case pt.EXPORT:
      defaultTitle = pageContent.defaultTitleExport
      pageHeader = pageContent.pageHeaderExport
      errorMessages = pageContent.errorMessagesExport
      break
    case pt.MIC:
    case pt.TEC:
    case pt.POC:
    case pt.REEXPORT:
      defaultTitle = pageContent.defaultTitleReexport
      pageHeader = pageContent.pageHeaderReexport
      errorMessages = pageContent.errorMessagesReexport
      break
    case pt.ARTICLE_10:
      defaultTitle = pageContent.defaultTitleArticle10
      pageHeader = pageContent.pageHeaderArticle10
      errorMessages = pageContent.errorMessagesArticle10
      break
    default:
      throw new Error(`Unknown permit type ${permitType}`)
  }
  return { defaultTitle, pageHeader, errorMessages }
}

function getPageContentAndBackLink (data) {
  let pageContent = null
  let defaultBackLink = `${previousPathContactDetails}/${data.contactType}`

  const postcodeText = lodash.cloneDeep(textContent.postcode) // Need to clone the source of the text content so that the merge below doesn't affect other pages.

  if (data.contactType === 'applicant') {
    if (data.isAgent) {
      pageContent = lodash.merge(postcodeText.common, postcodeText.agentLed)
    } else {
      pageContent = lodash.merge(postcodeText.common, postcodeText.applicant)
    }
  } else if (data.contactType === 'agent') {
    pageContent = lodash.merge(postcodeText.common, postcodeText.agent)
  } else {
    pageContent = lodash.merge(postcodeText.common, postcodeText.delivery)
    defaultBackLink = previousPathSelectDeliveryAddress
  }

  return { pageContent, defaultBackLink }
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}/{contactType}`,
  options: {
    validate: {
      params: Joi.object({
        contactType: Joi.string().valid(...contactTypes)
      }),
      failAction: (_request, _h, error) => {
        console.log(error)
      }
    }
  },
  handler: async (request, h) => {
    const submission = getSubmission(request)

    try {
      validateSubmission(submission, `${pageId}/${request.params.contactType}`)
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }

    const pageData = {
      backLinkOverride: checkChangeRouteExit(request, true),
      contactType: request.params.contactType,
      isAgent: submission?.isAgent,
      permitType: submission?.permitType,
      postcode: submission[request.params.contactType]?.candidateAddressData?.addressSearchData?.postcode
    }

    return h.view(pageId, createModel(null, pageData))
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
        postcode: Joi.string().regex(POSTCODE_REGEX).required()
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)
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
      const contactType = request.params.contactType

      const submission = {
        [contactType]: {
          candidateAddressData: {
            addressSearchData: {
              postcode: request.payload.postcode.trim().toUpperCase()
            }
          }
        }
      }

      try {
        mergeSubmission(request, submission, `${pageId}/${contactType}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const redirectTo = `${nextPath}/${contactType}`
      saveDraftSubmission(request, redirectTo)
      return h.redirect(redirectTo)
    }
  }
}]
