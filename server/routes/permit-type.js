const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList } = require('../helpers/helper-functions')
//const { setYarValue, getYarValue } = require('../helpers/session')

const viewTemplate = 'permit-type'
const currentPath = `${urlPrefix}/${viewTemplate}`
const previousPath = `${urlPrefix}/apply-cites-permit`
const nextPath = `${urlPrefix}/agent`
//const detailsPath = `${urlPrefix}/check-details`

function createModel(errorList, permitType) {

  return {
    backLink: previousPath,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? 'Error: Select the type of permit or certificate you are applying for' : 'What type of permit or certificate are you applying for?',
    serviceName: 'Apply for a CITES permit to move or trade endangered species',
    inputPermitType: {
      id: "permitType",
      name: "permitType",
      fieldset: {
        legend: {
          text: "What type of permit or certificate are you applying for?",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "import",
          text: "Import",
          hint: { text: "To move a species into Great Britain from another country." }
        },
        {
          value: "export",
          text: "Export",
          hint: { text: "To move a species out of Great Britain to another country." }
        },
        {
          value: "reexport",
          text: "Re-export",
          hint: { text: "To move a species that has already been imported into Great Britain to another country." }
        },
        {
          value: "article10",
          text: "Article 10",
          hint: { text: "To use any CITES annex A specimen for commercial purposes." }
        },
        {
          value: "other",
          text: "Other"
        }
      ],

      ...(permitType ? { value: permitType } : {}),
      ...(errorList && errorList.some(err => err.href === '#permitType') ? { errorMessage: { text: errorList.find(err => err.href === '#permitType').text } } : {})
    }
  }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    // let permitType = getYarValue(request, 'permitType') || null
    let permitType = null;
    return h.view(viewTemplate, createModel(null, permitType));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        permitType: Joi.string().required()
      }),
      failAction: (request, h, err) => {
        const errorList = []
        const fields = ['permitType']
        fields.forEach(field => {
          const fieldError = findErrorList(err, [field])[0]
          if (fieldError) {
            errorList.push({
              text: fieldError,
              href: `#${field}`
            })
          }
        })
        // const { projectName, businessName, numberEmployees, businessTurnover, sbi } = request.payload
        // const businessDetails = { projectName, businessName, numberEmployees, businessTurnover, sbi }
        
        return h.view(viewTemplate, createModel(errorList, request.payload)).takeover()
      }
    },
    handler: async (request, h) => {

      //setYarValue(request, 'permitType', request.payload)
      return h.redirect(nextPath);
    }
  },
}
]