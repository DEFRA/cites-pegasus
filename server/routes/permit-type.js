const Joi = require('joi')
const { urlPrefix, enableOtherPermitTypes } = require('../../config/config')
const { getErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { permitTypeOption: pto, getPermit } = require('../lib/permit-type-helper')
const { getSubmission, setSubmission, createSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require('../lib/change-route')
const textContent = require('../content/text-content')
const pageId = 'permit-type'
const viewName = 'application-radios-layout'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/`
const nextPathApplyingOnBehalf = `${urlPrefix}/applying-on-behalf`
const nextPathOtherPermitType = `${urlPrefix}/other-permit-type`
const cannotUseServicePath = `${urlPrefix}/cannot-use-service`
const invalidSubmissionPath = `${urlPrefix}/`
const previousPathYourSubmission = `${urlPrefix}/your-submission`

function createModel (errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.permitType
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['permitTypeOption'])

  let defaultBacklink = previousPath
  if (data.fromYourSubmission) {
    defaultBacklink = previousPathYourSubmission
  }
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    // helpBarContent: { helpBarQuestion: commonContent.helpBarQuestion, helpBarLinkText: commonContent.helpBarLinkText },
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    radios: {
      name: 'permitTypeOption',
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: 'govuk-fieldset__legend--l'
        }
      },
      items: [
        {
          value: pto.IMPORT,
          text: pageContent.radioOptionImport,
          hint: { text: pageContent.radioOptionImportHint },
          checked: isChecked(data.permitTypeOption, pto.IMPORT)
        },
        {
          value: pto.EXPORT,
          text: pageContent.radioOptionExport,
          hint: { text: pageContent.radioOptionExportHint },
          checked: isChecked(data.permitTypeOption, pto.EXPORT)
        },
        {
          value: pto.REEXPORT,
          text: pageContent.radioOptionReexport,
          hint: { text: pageContent.radioOptionReexportHint },
          checked: isChecked(data.permitTypeOption, pto.REEXPORT)
        },
        {
          value: pto.ARTICLE_10,
          text: pageContent.radioOptionArticle10,
          hint: { text: pageContent.radioOptionArticle10Hint },
          checked: isChecked(data.permitTypeOption, pto.ARTICLE_10)
        },
        {
          value: pto.OTHER,
          text: pageContent.radioOptionOther,
          checked: isChecked(data.permitTypeOption, pto.OTHER)
        }
      ],
      errorMessage: getFieldError(errorList, '#permitTypeOption')
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const submission = getSubmission(request)

    let applicationStatuses = []
    try {
      applicationStatuses = validateSubmission(submission, pageId).applicationStatuses
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }

    const fromYourSubmission = applicationStatuses.some((application) => application.status === 'complete')

    const pageData = {
      backLinkOverride: checkChangeRouteExit(request, true),
      permitTypeOption: submission?.permitTypeOption,
      fromYourSubmission: fromYourSubmission
    }

    return h.view(viewName, createModel(null, pageData))
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        permitTypeOption: Joi.string().required().valid(pto.IMPORT, pto.EXPORT, pto.REEXPORT, pto.ARTICLE_10, pto.OTHER)
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)
        const { applicationStatuses } = validateSubmission(submission, pageId)
        const pageData = {
          backLinkOverride: checkChangeRouteExit(request, true),
          permitTypeOption: request.payload.permitTypeOption,
          fromYourSubmission: applicationStatuses.some((application) => application.status === 'complete')
        }

        return h.view(viewName, createModel(err, pageData)).takeover()
      }
    },
    handler: async (request, h) => {
      let submission = getSubmission(request)

      if (!submission) {
        submission = createSubmission(request)
      }

      const isChange = submission.permitTypeOption && submission.permitTypeOption !== request.payload.permitTypeOption

      if (isChange) {
        // Clear the whole submission if the permit type has changed
        submission = createSubmission(request)
      }

      submission.permitTypeOption = request.payload.permitTypeOption
      submission.permitType = getPermit(submission.otherPermitTypeOption || request.payload.permitTypeOption).permitType

      try {
        setSubmission(request, submission, pageId)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      if (isChange) {
        setDataRemoved(request)
      }

      const exitChangeRouteUrl = checkChangeRouteExit(request, false, !isChange)

      if (exitChangeRouteUrl) {
        saveDraftSubmission(request, exitChangeRouteUrl)
        return h.redirect(exitChangeRouteUrl)
      }

      let redirectTo

      if (request.payload.permitTypeOption === pto.OTHER) {
        redirectTo = enableOtherPermitTypes ? nextPathOtherPermitType : cannotUseServicePath
      } else {
        redirectTo = nextPathApplyingOnBehalf
      }

      saveDraftSubmission(request, redirectTo)
      return h.redirect(redirectTo)
    }
  }
}]
