const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, setLabelData} = require('../helpers/helper-functions')
const { setYarValue, getYarValue } = require('../helpers/session')

const viewTemplate = 'agent'
const currentPath = `${urlPrefix}/${viewTemplate}`
const previousPath = `${urlPrefix}/permit-type`
const nextPath = `${urlPrefix}/owner-contact-details`

function createModel(errorList, isAgent) {
  return {
    backLink: previousPath,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? 'Error: Select yes if you are applying on behalf of someone else' : 'Are you applying on behalf of someone else?',
    serviceName: 'Apply for a CITES permit to move or trade endangered species',
    inputIsAgent: {
      id: "isAgent",
      name: "isAgent",
      classes: "govuk-radios--inline",
      fieldset: {
        legend: {
          text: "Are you applying on behalf of someone else?",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      hint: { 
        text: "This includes if you’re completing this application as an agent or on behalf of someone else. For example, a friend, family member or business." 
      },
      items: setLabelData(isAgent, ['Yes', 'No']),
      
      //...(isAgent ? { value: isAgent } : {}),
      ...(errorList && errorList.some(err => err.href === '#isAgent') ? { errorMessage: { text: errorList.find(err => err.href === '#isAgent').text } } : {})
    }
  }
  
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    let isAgent = getYarValue(request, 'isAgent') || null
    //isAgent = null;
    return h.view(viewTemplate, createModel(null, isAgent));
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
      setYarValue(request, 'isAgent', request.payload.isAgent)
      return h.redirect(nextPath);
    }
  },
}
]