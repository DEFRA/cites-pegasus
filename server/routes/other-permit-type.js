const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { permitTypeOption: pto, getPermit } = require('../lib/permit-type-helper')
const { getSubmission, setSubmission, createSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'other-permit-type'
const viewName = 'application-radios-layout'
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
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, [ "otherPermitTypeOption" ])
  
  const defaultBacklink = previousPath

  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    radios: {
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
          value: pto.MIC,
          text: pageContent.radioOptionMIC,
          checked: isChecked(data.otherPermitTypeOption, pto.MIC)
        },
        {
          value: pto.TEC,
          text: pageContent.radioOptionTEC,
          checked: isChecked(data.otherPermitTypeOption, pto.TEC)
        },
        {
          value: pto.POC,
          text: pageContent.radioOptionPOC,
          checked: isChecked(data.otherPermitTypeOption, pto.POC)
        },
        {
          value: pto.SEMI_COMPLETE,
          text: pageContent.radioOptionSemiComplete,
          checked: isChecked(data.otherPermitTypeOption, pto.SEMI_COMPLETE)
        },
        {
          value: pto.DRAFT,
          text: pageContent.radioOptionDraft,
          checked: isChecked(data.otherPermitTypeOption, pto.DRAFT)
        },
        {
          value: pto.OTHER,
          text: pageContent.radioOptionOther,
          checked: isChecked(data.otherPermitTypeOption, pto.OTHER)
        }
      ],
      errorMessage: getFieldError(errorList, '#otherPermitTypeOption')
    }
  }
  return { ...commonContent, ...model }
}

function getRedirect(otherPermitTypeOption) {
  let redirectTo = null
  switch (otherPermitTypeOption) {
    case pto.MIC:
    case pto.TEC:
    case pto.POC:
      redirectTo = nextPathGuidanceCompletion
      break
    case pto.SEMI_COMPLETE:
    case pto.DRAFT:
      redirectTo = nextPathApplyingOnBehalf
      break
    case pto.OTHER:
      redirectTo = cannotUseServicePath
      break
    default:
      throw new Error(`Unknown other permit type ${otherPermitTypeOption}`)
  }
  return redirectTo
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

    const fromYourSubmission = applicationStatuses.some((application) => application.status === "complete")

    const pageData = {
      backLinkOverride: checkChangeRouteExit(request, true),
      otherPermitTypeOption: submission?.otherPermitTypeOption,
      fromYourSubmission: fromYourSubmission
    }

    return h.view(viewName, createModel(null, pageData));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        otherPermitTypeOption: Joi.string().required().valid(pto.MIC, pto.TEC, pto.POC, pto.SEMI_COMPLETE, pto.DRAFT, pto.OTHER)
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)
        const { applicationStatuses } = validateSubmission(submission, pageId)
        const pageData = {
          backLinkOverride: checkChangeRouteExit(request, true),
          otherPermitTypeOption: request.payload.otherPermitTypeOption,
          fromYourSubmission: applicationStatuses.some((application) => application.status === "complete")
        }

        return h.view(viewName, createModel(err, pageData)).takeover()
      }
    },
    handler: async (request, h) => {

      let submission = getSubmission(request)

      const isChange = submission.otherPermitTypeOption && submission.otherPermitTypeOption !== request.payload.otherPermitTypeOption

      if (isChange) {
        //Clear the whole submission if the permit type has changed
        submission = createSubmission(request)
        submission.permitTypeOption = pto.OTHER
      }

      submission.otherPermitTypeOption = request.payload.otherPermitTypeOption

      const permit = getPermit(request.payload.otherPermitTypeOption, submission.applications[0].useCertificateFor)
      submission.permitType = permit.permitType
      submission.applications[0].permitSubType = permit.permitSubType

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

      const redirectTo = getRedirect(request.payload.otherPermitTypeOption)
      saveDraftSubmission(request, redirectTo)
      return h.redirect(redirectTo)
    }
  },
}]