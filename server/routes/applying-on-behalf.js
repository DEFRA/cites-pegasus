const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, setLabelData } = require('../lib/helper-functions')
const { mergeAppData, getAppData, validateAppData } = require('../lib/app-data')

const textContent = require('../content/text-content')
const pageId = 'applying-on-behalf'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/permit-type`
const nextPath = `${urlPrefix}/contact-details/`
const invalidAppDataPath = urlPrefix

function createModel(errors, isAgent) {
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

// function validateAppData(appData) {
//   if (appData.permitType === null) { throw 'appData error: permitType is null' }
//   if (appData.permitType === 'other') { throw 'appData error: permitType is "other"' }
// }

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const appData = getAppData(request) || null

    try {
      validateAppData(appData, pageId)
      
    }
    catch (err) {
      console.log(err);
      return h.redirect(`${invalidAppDataPath}/`)
    }

    return h.view(pageId, createModel(null, appData?.isAgent));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        isAgent: Joi.string().required()
      }),
      failAction: (request, h, err) => {
        return h.view(pageId, createModel(err, request.payload.isAgent)).takeover()
      }
    },
    handler: async (request, h) => {
      const isAgent = request.payload.isAgent === 'Yes';

      try {
        agentData = isAgent ? { isAgent: isAgent } : { isAgent: isAgent, agent: null } 

        mergeAppData(request, agentData, pageId)        
      }
      catch (err){
        console.log(err);
        return h.redirect(`${invalidAppDataPath}/`)
      }
      
      const pathSuffix = isAgent ? 'agent' : 'applicant'
      return h.redirect(nextPath + pathSuffix);
    }
  },
}]