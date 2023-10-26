const Joi = require('joi')
const { urlPrefix, enableOtherPermitTypes } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { permitType: pt } = require('../lib/constants')
const { getSubmission, setSubmission, createSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'permit-type'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/`
const nextPathApplyingOnBehalf = `${urlPrefix}/applying-on-behalf`
const nextPathOtherPermitType = `${urlPrefix}/other-permit-type`
const cannotUseServicePath = `${urlPrefix}/cannot-use-service`
const invalidSubmissionPath = `${urlPrefix}/`
const previousPathYourSubmission = `${urlPrefix}/your-submission`
const otherOption = 'other'

function createModel(errors, data) {
  const commonContent = textContent.common;
  const pageContent = textContent.permitType;

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
    const fields = ['permitTypeOption']
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

  let defaultBacklink = previousPath
  if (data.fromYourSubmission) {
    defaultBacklink = previousPathYourSubmission
  }
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    inputPermitType: {
      idPrefix: "permitTypeOption",
      name: "permitTypeOption",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: pt.import,
          text: pageContent.radioOptionImport,
          hint: { text: pageContent.radioOptionImportHint },
          checked: isChecked(data.permitTypeOption, pt.import)
        },
        {
          value: pt.export,
          text: pageContent.radioOptionExport,
          hint: { text: pageContent.radioOptionExportHint },
          checked: isChecked(data.permitTypeOption, pt.export)
        },
        {
          value: pt.reexport,
          text: pageContent.radioOptionReexport,
          hint: { text: pageContent.radioOptionReexportHint },
          checked: isChecked(data.permitTypeOption, pt.reexport)
        },
        {
          value: pt.article10,
          text: pageContent.radioOptionArticle10,
          hint: { text: pageContent.radioOptionArticle10Hint },
          checked: isChecked(data.permitTypeOption, pt.article10)
        },
        {
          value: otherOption,
          text: pageContent.radioOptionOther,
          checked: isChecked(data.permitTypeOption, otherOption)
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

    let appStatuses = []
    try {
      appStatuses = validateSubmission(submission, pageId)
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }

    const fromYourSubmission = appStatuses.some((application) => application.status === "complete")    

    const pageData = {
      backLinkOverride: checkChangeRouteExit(request, true),
      permitTypeOption: submission?.permitTypeOption,
      fromYourSubmission: fromYourSubmission
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
        permitTypeOption: Joi.string().required().valid(pt.import, pt.export, pt.reexport, pt.article10, otherOption)
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)
        const appStatuses = validateSubmission(submission, pageId)
        const pageData = {
          backLinkOverride: checkChangeRouteExit(request, true),
          permitTypeOption: request.payload.permitTypeOption,
          fromYourSubmission: appStatuses.some((application) => application.status === "complete")
        }

        return h.view(pageId, createModel(err, pageData)).takeover()
      }
    },
    handler: async (request, h) => {

      // if (request.payload.permitTypeOption === 'other' && enableOtherPermitTypes){
      //   return h.redirect(nextPathOtherPermitType)
      // }

      let submission = getSubmission(request)

      if (!submission) {
        submission = createSubmission(request)
      }

      const isChange = submission.permitTypeOption && submission.permitTypeOption !== request.payload.permitTypeOption

      if (isChange) {
        //Clear the whole submission if the permit type has changed
        submission = createSubmission(request)
      }

      submission.permitTypeOption = request.payload.permitTypeOption
      if(enableOtherPermitTypes){
        if(request.payload.permitTypeOption !== otherOption){
          submission.permitType = request.payload.permitTypeOption
          submission.permitSubType = null
        }
      } else {
        submission.permitType = request.payload.permitTypeOption
        delete submission.permitSubType
      }
      
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

      if(request.payload.permitTypeOption === otherOption){
        redirectTo = enableOtherPermitTypes ? nextPathOtherPermitType : cannotUseServicePath
      } else {
        redirectTo = nextPathApplyingOnBehalf
      }

      saveDraftSubmission(request, redirectTo)
      return h.redirect(redirectTo)
    }
  },
}]