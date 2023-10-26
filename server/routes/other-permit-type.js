const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { permitType: pt } = require('../lib/constants')
const { getSubmission, setSubmission, createSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'other-permit-type'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/permit-type`
const nextPathApplyingOnBehalf = `${urlPrefix}/applying-on-behalf`
const cannotUseServicePath = `${urlPrefix}/cannot-use-service`
const invalidSubmissionPath = `${urlPrefix}/`
const previousPathYourSubmission = `${urlPrefix}/your-submission`
const otherOption = 'other'

function createModel(errors, data) {
  const commonContent = textContent.common;
  const pageContent = textContent.otherPermitType;

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
    const fields = ['otherPermitTypeOption']
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
    inputOtherPermitType: {
      idPrefix: "otherPermitTypeOption",
      name: "otherPermitTypeOption",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: pt.mic,
          text: pageContent.radioOptionMIC,
          checked: isChecked(data.otherPermitTypeOption, pt.mic)
        },
        {
          value: pt.tec,
          text: pageContent.radioOptionTEC,
          checked: isChecked(data.otherPermitTypeOption, pt.tec)
        },
        {
          value: pt.poc,
          text: pageContent.radioOptionPOC,
          checked: isChecked(data.otherPermitTypeOption, pt.poc)
        },
        {
          value: pt.semiComplete,
          text: pageContent.radioOptionSemiComplete,
          checked: isChecked(data.otherPermitTypeOption, pt.semiComplete)
        },
        {
          value: pt.draft,
          text: pageContent.radioOptionDraft,
          checked: isChecked(data.otherPermitTypeOption, pt.draft)
        },
        {
          value: otherOption,
          text: pageContent.radioOptionOther,
          checked: isChecked(data.otherPermitTypeOption, otherOption)
        }
      ],
      errorMessage: getFieldError(errorList, '#otherPermitTypeOption')
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
      otherPermitTypeOption: submission?.otherPermitTypeOption,
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
        otherPermitTypeOption: Joi.string().required().valid(pt.mic, pt.tec, pt.poc, pt.semiComplete, pt.draft, otherOption)
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)
        const appStatuses = validateSubmission(submission, pageId)
        const pageData = {
          backLinkOverride: checkChangeRouteExit(request, true),
          otherPermitTypeOption: request.payload.otherPermitTypeOption,
          fromYourSubmission: appStatuses.some((application) => application.status === "complete")
        }

        return h.view(pageId, createModel(err, pageData)).takeover()
      }
    },
    handler: async (request, h) => {

      let submission = getSubmission(request)

      const isChange = submission.otherPermitTypeOption && submission.otherPermitTypeOption !== request.payload.otherPermitTypeOption

      if (isChange) {
        //Clear the whole submission if the permit type has changed
        submission = createSubmission(request)
        submission.permitTypeOption = otherOption
      }

      submission.otherPermitTypeOption = request.payload.otherPermitTypeOption

      switch (request.payload.otherPermitTypeOption) {
        case pt.mic:
        case pt.poc:
        case pt.tec:
        case pt.other:
          submission.permitType = request.payload.otherPermitTypeOption
          submission.permitSubType = null
          break
        case pt.semiComplete:
          submission.permitType = pt.reexport
          submission.permitSubType = pt.semiComplete
          break
        case pt.draft:
          submission.permitType = pt.import
          submission.permitSubType = pt.draft
          break        
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

      const redirectTo = request.payload.otherPermitTypeOption === otherOption ? cannotUseServicePath : nextPathApplyingOnBehalf

      saveDraftSubmission(request, redirectTo)
      return h.redirect(redirectTo)
    }
  },
}]