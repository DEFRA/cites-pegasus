const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const textContent = require("../content/text-content")
const { checkChangeRouteExit } = require("../lib/change-route")
const { govukClass } = require("../lib/constants")
const pageId = "purpose-code"
const viewName = 'application-radios-layout'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/source-code`
const nextPathSpecimenType = `${urlPrefix}/specimen-type`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.purposeCode
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["purposeCode"])
  
  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    radios: {
      name: "purposeCode",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "B",
          text: pageContent.radioOptionB,
          hint: { text: pageContent.radioOptionBHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "B")
        },
        {
          value: "E",
          text: pageContent.radioOptionE,
          hint: { text: pageContent.radioOptionEHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "E")
        },
        {
          value: "G",
          text: pageContent.radioOptionG,
          hint: { text: pageContent.radioOptionGHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "G")
        },
        {
          value: "H",
          text: pageContent.radioOptionH,
          hint: { text: pageContent.radioOptionHHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "H")
        },
        {
          value: "L",
          text: pageContent.radioOptionL,
          hint: { text: pageContent.radioOptionLHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "L")
        },
        {
          value: "M",
          text: pageContent.radioOptionM,
          hint: { text: pageContent.radioOptionMHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "M")
        },
        {
          value: "N",
          text: pageContent.radioOptionN,
          hint: { text: pageContent.radioOptionNHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "N")
        },
        {
          value: "P",
          text: pageContent.radioOptionP,
          hint: { text: pageContent.radioOptionPHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "P")
        },
        {
          value: "Q",
          text: pageContent.radioOptionQ,
          hint: { text: pageContent.radioOptionQHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "Q")
        },
        {
          value: "S",
          text: pageContent.radioOptionS,
          hint: { text: pageContent.radioOptionSHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "S")
        },
        {
          value: "T",
          text: pageContent.radioOptionT,
          hint: { text: pageContent.radioOptionTHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "T")
        },
        {
          value: "Z",
          text: pageContent.radioOptionZ,
          hint: { text: pageContent.radioOptionZHint },
          label: {
            classes: govukClass.FONT_WEIGHT_BOLD
          },
          checked: isChecked(data.purposeCode, "Z")
        }
      ],
      errorMessage: getFieldError(errorList, "#purposeCode")
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const submission = getSubmission(request)

      try {
        validateSubmission(
          submission,
          `${pageId}/${request.params.applicationIndex}`
        )
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[request.params.applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: request.params.applicationIndex,
        speciesName: species.speciesName,
        purposeCode: species.purposeCode
      }

      return h.view(viewName, createModel(null, pageData))
    }
  },

  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          purposeCode: Joi.string().valid("B", "E", "G", "H", "L", "M", "N", "P", "Q", "S", "T", "Z").required()
        }),
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const species = submission.applications[request.params.applicationIndex].species

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: request.params.applicationIndex,
            speciesName: species.speciesName,
            ...request.payload

          }
          return h.view(viewName, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)

        submission.applications[applicationIndex].species.purposeCode = request.payload.purposeCode

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        }
        catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        const redirectTo = `${nextPathSpecimenType}/${applicationIndex}`
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)

      }
    }
  }
]
