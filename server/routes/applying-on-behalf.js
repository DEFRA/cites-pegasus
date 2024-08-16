const Joi = require('joi')
const { urlPrefix, enableOtherPermitTypes } = require("../../config/config")
const { getErrorList, getFieldError, setLabelData } = require('../lib/helper-functions')
const { mergeSubmission, getSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { permitTypeOption: pto } = require('../lib/permit-type-helper')
const textContent = require('../content/text-content')
const pageId = 'applying-on-behalf'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPermitType = `${urlPrefix}/permit-type`
const previousPathOtherPermitType = `${urlPrefix}/other-permit-type`
const previousPathGuidanceCompletion = `${urlPrefix}/guidance-completion`
const nextPath = `${urlPrefix}/contact-details/applicant`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.applyingOnBehalf

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["isAgent"])
  
  let backLink = null
  if (enableOtherPermitTypes && data.otherPermitTypeOption) {
    if ([pto.MIC, pto.TEC, pto.POC].includes(data.otherPermitTypeOption)) {
      backLink = previousPathGuidanceCompletion
    } else {
      backLink = previousPathOtherPermitType
    }
  } else {
    backLink = previousPathPermitType
  }

  const model = {
    backLink,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageHeader: pageContent.pageHeader,
    pageBody1: pageContent.pageBody1,
    pageBody2: pageContent.pageBody2,
    bulletListItems: pageContent.bulletListItems,
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    inputName: "isAgent",
    inputClasses: "govuk-radios--inline",
    inputYesChecked: data.isAgent,
    errorMessage: getFieldError(errorList, '#isAgent')
  }

  return { ...commonContent, ...model }

}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const submission = getSubmission(request) || null

    try {
      validateSubmission(submission, pageId)

    }
    catch (err) {
      console.error(err);
      return h.redirect(invalidSubmissionPath)
    }

    const pageData = {
      isAgent: submission.isAgent,
      otherPermitTypeOption: submission.otherPermitTypeOption
    }

    return h.view(pageId, createModel(null, pageData));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        isAgent: Joi.boolean().required()
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)
        const pageData = {
          isAgent: request.payload.isAgent,
          otherPermitTypeOption: submission.otherPermitTypeOption
        }
        return h.view(pageId, createModel(err, pageData)).takeover()
      }
    },
    handler: async (request, h) => {
      const isAgent = request.payload.isAgent

      try {
        const agentData = isAgent ? { isAgent: isAgent } : { isAgent: isAgent, agent: null }

        mergeSubmission(request, agentData, pageId)
      }
      catch (err) {
        console.error(err);
        return h.redirect(invalidSubmissionPath)
      }

      saveDraftSubmission(request, nextPath)
      return h.redirect(nextPath)
    }
  },
}]