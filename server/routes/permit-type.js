const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, setSubmission, createSubmission, validateSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'permit-type'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/`
const nextPath = `${urlPrefix}/applying-on-behalf`
const cannotUseServicePath = `${urlPrefix}/cannot-use-service`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
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

  const defaultBacklink = previousPath
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
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
          checked: isChecked(data.permitType, "import")
        },
        {
          value: "export",
          text: pageContent.radioOptionExport,
          hint: { text: pageContent.radioOptionExportHint },
          checked: isChecked(data.permitType, "export")
        },
        {
          value: "reexport",
          text: pageContent.radioOptionReexport,
          hint: { text: pageContent.radioOptionReexportHint },
          checked: isChecked(data.permitType, "reexport")
        },
        {
          value: "article10",
          text: pageContent.radioOptionArticle10,
          hint: { text: pageContent.radioOptionArticle10Hint },
          checked: isChecked(data.permitType, "article10")
        },
        {
          value: "other",
          text: pageContent.radioOptionOther,
          checked: isChecked(data.permitType, "other")
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

    try {
      validateSubmission(submission, pageId)
    } catch (err) {
      console.log(err)
      return h.redirect(invalidSubmissionPath)
    }

    const pageData = {
      backLinkOverride: checkChangeRouteExit(request, true),
      permitType: submission?.permitType
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
        permitType: Joi.string().required().valid('import', 'export', 'reexport', 'article10', 'other')
      }),
      failAction: (request, h, err) => {
        const pageData = {
          backLinkOverride: checkChangeRouteExit(request, true),
          permitType: request.payload.permitType
        }

        return h.view(pageId, createModel(err, pageData)).takeover()
      }
    },
    handler: async (request, h) => {
      //mergeSubmission(request, {permitType: request.payload.permitType});
      let submission = getSubmission(request)

      if (!submission) {
        submission = createSubmission(request)
      }

      const isChange = submission.permitType && submission.permitType !== request.payload.permitType

      if (isChange) {
        //Clear the whole submission if the permit type has changed
        submission = createSubmission(request)
      }

      submission.permitType = request.payload.permitType

      try {
        setSubmission(request, submission, pageId)
      } catch (err) {
        console.log(err)
        return h.redirect(invalidSubmissionPath)
      }

      if (isChange) {
        setDataRemoved(request)
      }

      const exitChangeRouteUrl = checkChangeRouteExit(request, false, !isChange)
      if (exitChangeRouteUrl) {
        return h.redirect(exitChangeRouteUrl)
      }

      return request.payload.permitType === 'other' ? h.redirect(cannotUseServicePath) : h.redirect(nextPath);
    }
  },
}]