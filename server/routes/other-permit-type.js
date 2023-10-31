const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { permitTypeOption: pto, getPermit } = require('../lib/permit-type-helper')
const { getSubmission, setSubmission, createSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'other-permit-type'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/permit-type`
const nextPathApplyingOnBehalf = `${urlPrefix}/applying-on-behalf`
const nextPathGuidanceCompletion = `${urlPrefix}/guidance-completion`
const cannotUseServicePath = `${urlPrefix}/cannot-use-service`
const invalidSubmissionPath = `${urlPrefix}/`
const previousPathYourSubmission = `${urlPrefix}/your-submission`


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
          value: pto.mic,
          text: pageContent.radioOptionMIC,
          checked: isChecked(data.otherPermitTypeOption, pto.mic)
        },
        {
          value: pto.tec,
          text: pageContent.radioOptionTEC,
          checked: isChecked(data.otherPermitTypeOption, pto.tec)
        },
        {
          value: pto.poc,
          text: pageContent.radioOptionPOC,
          checked: isChecked(data.otherPermitTypeOption, pto.poc)
        },
        {
          value: pto.semiComplete,
          text: pageContent.radioOptionSemiComplete,
          checked: isChecked(data.otherPermitTypeOption, pto.semiComplete)
        },
        {
          value: pto.draft,
          text: pageContent.radioOptionDraft,
          checked: isChecked(data.otherPermitTypeOption, pto.draft)
        },
        {
          value: pto.other,
          text: pageContent.radioOptionOther,
          checked: isChecked(data.otherPermitTypeOption, pto.other)
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
        otherPermitTypeOption: Joi.string().required().valid(pto.mic, pto.tec, pto.poc, pto.semiComplete, pto.draft, pto.other)
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
        submission.permitTypeOption = pto.other
      }

      submission.otherPermitTypeOption = request.payload.otherPermitTypeOption

      submission.permitType = getPermit(request.payload.otherPermitTypeOption).permitType
      // switch (request.payload.otherPermitTypeOption) {
      //   case pt.mic:
      //   case pt.poc:
      //   case pt.tec:
      //   case pt.other:
      //     submission.permitType = request.payload.otherPermitTypeOption
      //     submission.permitSubType = null
      //     break
      //   case pt.semiComplete:
      //     submission.permitType = pt.reexport
      //     break
      //   case pt.draft:
      //     submission.permitType = pt.import          
      //     break
      // }

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
      switch (request.payload.otherPermitTypeOption) {
        case pto.mic:
        case pto.tec:
        case pto.poc:
          redirectTo = nextPathGuidanceCompletion
          break
        case pto.semiComplete:
        case pto.draft:
          redirectTo = nextPathApplyingOnBehalf
          break
        case pto.other:
          redirectTo = cannotUseServicePath
          break
      }
      saveDraftSubmission(request, redirectTo)
      return h.redirect(redirectTo)
    }
  },
}]