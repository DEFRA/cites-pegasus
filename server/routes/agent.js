const Joi = require('joi')
const urlPrefix = require('../config').urlPrefix
const { findErrorList } = require('../helpers/helper-functions')

const viewTemplate = 'agent'
const currentPath = `${urlPrefix}/${viewTemplate}`
const previousPath = `${urlPrefix}/permit-type`
//const nextPath = `${urlPrefix}/agent`

function createModel(errorList, isAgent, hasDetails) {

  const x = {
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
      items: [
        {
          value: "yes",
          text: "Yes"
        },
        {
          value: "no",
          text: "No"
        }
      ],

      ...(isAgent ? { value: isAgent } : {}),
      ...(errorList && errorList.some(err => err.href === '#isAgent') ? { errorMessage: { text: errorList.find(err => err.href === '#isAgent').text } } : {})
    }
  }
  console.log(x);
  return x;
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    isAgent = null;
    return h.view(viewTemplate, createModel(null, isAgent, null));
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

        return h.view(viewTemplate, createModel(errorList, request.payload, null)).takeover()
      }
    },
    handler: async (request, h) => {
      return h.redirect(nextPath);
    }
  },
}
]