const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, setLabelData} = require('../helpers/helper-functions')
const { setAppData, getAppData } = require('../helpers/session')

const textContent = require('../content/text-content')
const viewTemplate = 'agent'
const currentPath = `${urlPrefix}/${viewTemplate}`
const previousPath = `${urlPrefix}/permit-type`
const nextPath = `${urlPrefix}/owner-contact-details`

function createModel(errorList, isAgent) {
  var commonContent = textContent.common;
  var pageContent = textContent.agent;

  return {
    backLink: previousPath,
    backLinkButtonText: commonContent.backLinkButton,
    continueButtonText: commonContent.continueButton,
    errorSummaryTitleText: commonContent.errorSummaryTitle,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    serviceName: commonContent.serviceName,
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
      items: setLabelData(isAgent, [commonContent.radioOptionYes, commonContent.radioOptionNo]),
      
      //...(isAgent ? { value: isAgent } : {}),
      ...(errorList && errorList.some(err => err.href === '#isAgent') ? { errorMessage: { text: errorList.find(err => err.href === '#isAgent').text } } : {})
    }
  }
  
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const appData = getAppData(request) || null
    
    return h.view(viewTemplate, createModel(null, appData.isAgent));
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

        return h.view(viewTemplate, createModel(errorList, request.payload.isAgent)).takeover()
      }
    },
    handler: async (request, h) => {
      setAppData(request, {isAgent: request.payload.isAgent})
      return h.redirect(nextPath);
    }
  },
}
]