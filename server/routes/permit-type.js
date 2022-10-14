const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, isChecked } = require('../helpers/helper-functions')
const { getAppData, setAppData } = require('../helpers/session')
const { getClientCredentialsToken, test } = require('../authentication/client-credentials')
const textContent = require('../content/text-content')
const viewTemplate = 'permit-type'
const currentPath = `${urlPrefix}/${viewTemplate}`
const previousPath = `${urlPrefix}/apply-cites-permit`
const nextPath = `${urlPrefix}/agent`
const cannotUseServicePath = `${urlPrefix}/cannot-use-service`

//const detailsPath = `${urlPrefix}/check-details`

function createModel(errorList, permitType) {
  const commonContent = textContent.common;
  const pageContent = textContent.permitType;

  return {
    backLink: previousPath,
    backLinkButtonText: commonContent.backLinkButton,
    continueButtonText: commonContent.continueButton,
    errorSummaryTitleText: commonContent.errorSummaryTitle,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    serviceName: commonContent.serviceName,
    inputPermitType: {
      idPrefix: "permitType",
      name: "permitType",
      fieldset: {
        legend: {
          text: pageContent.heading,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "import",
          text: pageContent.radioOptionImport,
          hint: { text: pageContent.radioOptionImportHint },
          checked: isChecked(permitType, "import")
        },
        {
          value: "export",
          text: pageContent.radioOptionExport,
          hint: { text: pageContent.radioOptionExportHint },
          checked: isChecked(permitType, "export")
        },
        {
          value: "reexport",
          text: pageContent.radioOptionReexport,
          hint: { text: pageContent.radioOptionReexportHint },
          checked: isChecked(permitType, "reexport")
        },
        {
          value: "article10",
          text: pageContent.radioOptionArticle10,
          hint: { text: pageContent.radioOptionArticle10Hint },
          checked: isChecked(permitType, "article10")
        },
        {
          value: "other",
          text: pageContent.radioOptionOther,
          checked: isChecked(permitType, "other")
        }
      ],

      //...(permitType ? { value: permitType } : {}),
      ...(errorList && errorList.some(err => err.href === '#permitType') ? { errorMessage: { text: errorList.find(err => err.href === '#permitType').text } } : {})
    }
  }
}


module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    //test() //Test for authentication method

    const appData = getAppData(request);
   
    //let permitType = getYarValue(request, 'permitType') || null
    //let permitType = null;
    return h.view(viewTemplate, createModel(null, appData.permitType));
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
        
        return h.view(viewTemplate, createModel(errorList, request.payload.permitType)).takeover()
      }
    },
    handler: async (request, h) => {
      setAppData(request, {permitType: request.payload.permitType});

      //setYarValue(request, 'permitType', request.payload.permitType)
      return request.payload.permitType === 'other' ? h.redirect(cannotUseServicePath) : h.redirect(nextPath);
    }
  },
}
]