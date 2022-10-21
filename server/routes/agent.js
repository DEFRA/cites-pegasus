const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, setLabelData } = require('../helpers/helper-functions')
const { setAppData, getAppData, validateAppData } = require('../helpers/app-data')

const textContent = require('../content/text-content')
const pageId = 'agent'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/permit-type`
const nextPath = `${urlPrefix}/contact-details/`
const invalidAppDataPath = urlPrefix

function createModel(errorList, isAgent) {
  const commonContent = textContent.common;
  const pageContent = textContent.agent;
  let isAgentRadioVal = null
  switch (isAgent) {
    case true:
      isAgentRadioVal = commonContent.radioOptionYes
      break;
    case false:
      isAgentRadioVal = commonContent.radioOptionNo
      break;
  }

  const model = {
    backLink: previousPath,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    inputIsAgent: {
      id: "isAgent",
      name: "isAgent",
      classes: "govuk-radios--inline",
      fieldset: {
        legend: {
          text: pageContent.radioHeaderAgent,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      hint: {
        text: pageContent.radioHeaderAgentHint
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

    return h.view(pageId, createModel(null, appData.isAgent));
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
        const errorList = []
        const field = 'isAgent'
        const fieldError = findErrorList(err, [field])[0]
        if (fieldError) {
          errorList.push({
            text: fieldError,
            href: `#${field}`
          })
        }

        return h.view(pageId, createModel(errorList, request.payload.isAgent)).takeover()
      }
    },
    handler: async (request, h) => {
      const isAgent = request.payload.isAgent === 'Yes';

      try {
        setAppData(request, { isAgent: isAgent, agent: null }, pageId)        
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