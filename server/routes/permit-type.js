const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const pageId = 'permit-type'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/apply-cites-permit`
const nextPath = `${urlPrefix}/applying-on-behalf`
const cannotUseServicePath = `${urlPrefix}/cannot-use-service`

function createModel(errors, permitType) {
  const commonContent = textContent.common;
  const pageContent = textContent.permitType;

  let errorList = null
  if(errors){
      errorList = []
      const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
      const fields = ['permitType']
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
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    inputPermitType: {
      idPrefix: "permitType",
      name: "permitType",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
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
      errorMessage: getFieldError(errorList, '#permitType')
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const submission = getSubmission(request);
    validateSubmission(submission, pageId)

    return h.view(pageId, createModel(null, submission?.permitType));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        permitType: Joi.string().required().valid('import', 'export', 'reexport', 'article10', 'other')
      }),
      failAction: (request, h, err) => {
        return h.view(pageId, createModel(err, request.payload.permitType)).takeover()
      }
    },
    handler: async (request, h) => {
      mergeSubmission(request, {permitType: request.payload.permitType});

      return request.payload.permitType === 'other' ? h.redirect(cannotUseServicePath) : h.redirect(nextPath);
    }
  },
}]