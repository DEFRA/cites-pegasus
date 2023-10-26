const Joi = require('joi')
const { urlPrefix, enableOtherPermitType } = require("../../config/config")
const { findErrorList, getFieldError, setLabelData } = require('../lib/helper-functions')
const { mergeSubmission, getSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')

const textContent = require('../content/text-content')
const pageId = 'applying-on-behalf'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/permit-type`
const nextPath = `${urlPrefix}/contact-details/applicant`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, isAgent, permitType) {
  const commonContent = textContent.common;
  const pageContent = textContent.applyingOnBehalf;

  let isAgentRadioVal = null
  switch (isAgent) {
    case true:
      isAgentRadioVal = commonContent.radioOptionYes
      break;
    case false:
      isAgentRadioVal = commonContent.radioOptionNo
      break;
  }

  let errorList = null
  if(errors){
      errorList = []
      const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
      const fields = ['isAgent']
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

  let backLink = enableOtherPermitType && permitType

  const model = {
    backLink: previousPath,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageHeader: pageContent.pageHeader,
    pageBody1: pageContent.pageBody1,
    pageBody2: pageContent.pageBody2,
    bulletListItems: pageContent.bulletListItems,
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    inputIsAgent: {
      id: "isAgent",
      name: "isAgent",
      classes: "govuk-radios--inline",
      // fieldset: {
      //   legend: {
      //     text: pageContent.radioHeaderAgent,
      //     isPageHeading: true,
      //     classes: "govuk-fieldset__legend--l"
      //   }
      // },
      hint: {
        text: pageContent.radioIsAgentHint
      },
      items: setLabelData(isAgentRadioVal, [commonContent.radioOptionYes, commonContent.radioOptionNo]),
      errorMessage: getFieldError(errorList, '#isAgent')
    }
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

    return h.view(pageId, createModel(null, submission?.isAgent, submission?.permitType));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        isAgent: Joi.string().required().valid(textContent.common.radioOptionYes, textContent.common.radioOptionNo)
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)
        return h.view(pageId, createModel(err, request.payload.isAgent, submission?.permitType)).takeover()
      }
    },
    handler: async (request, h) => {
      const isAgent = request.payload.isAgent === textContent.common.radioOptionYes;

      try {
        const agentData = isAgent ? { isAgent: isAgent } : { isAgent: isAgent, agent: null } 

        mergeSubmission(request, agentData, pageId)        
      }
      catch (err){
        console.error(err);
        return h.redirect(invalidSubmissionPath)
      }
      
      saveDraftSubmission(request, nextPath)
      return h.redirect(nextPath)      
    }
  },
}]