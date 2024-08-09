const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError, stringToBool } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const { dateValidator } = require("../lib/validators")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "import-permit-details"
const viewName = 'permit-details'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathOriginPermitDetails = `${urlPrefix}/origin-permit-details`
const previousPathExportPermitDetails = `${urlPrefix}/export-permit-details`
const nextPath = `${urlPrefix}/additional-info`
const invalidSubmissionPath = `${urlPrefix}/`
const assetPath = `${urlPrefix}/assets`
const permitIssueDateFieldItems = {
  DATE: "importPermitIssueDate",
  DAY: "importPermitIssueDate-day",
  DAY_MONTH: "importPermitIssueDate-day-month",
  DAY_YEAR: "importPermitIssueDate-day-year",
  MONTH: "importPermitIssueDate-month",
  MONTH_YEAR: "importPermitIssueDate-month-year",
  YEAR: "importPermitIssueDate-year"
}

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.importPermitDetails

  const defaultBacklink = data.permitType === pt.ARTICLE_10 ? `${previousPathOriginPermitDetails}/${data.applicationIndex}` : `${previousPathExportPermitDetails}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const importPermitIssueDateErrors = []


  const errorList = getErrorList(
    errors,
    { ...commonContent.errorMessages, ...pageContent.errorMessages },
    ["importPermitNumber",
      permitIssueDateFieldItems.DATE,
      permitIssueDateFieldItems.DAY,
      permitIssueDateFieldItems.DAY_MONTH,
      permitIssueDateFieldItems.DAY_YEAR,
      permitIssueDateFieldItems.MONTH,
      permitIssueDateFieldItems.MONTH_YEAR,
      permitIssueDateFieldItems.YEAR,
      "importPermitDetailsNotKnown"]
  )

  if (errorList) {
    const permitIssueDateFields = [
      permitIssueDateFieldItems.DATE,
      permitIssueDateFieldItems.DAY,
      permitIssueDateFieldItems.DAY_MONTH,
      permitIssueDateFieldItems.DAY_YEAR,
      permitIssueDateFieldItems.MONTH,
      permitIssueDateFieldItems.MONTH_YEAR,
      permitIssueDateFieldItems.YEAR
    ]
    permitIssueDateFields.forEach((field) => {
      const error = getFieldError(errorList, "#" + field)
      if (error && field.includes("importPermitIssueDate")) {
        importPermitIssueDateErrors.push({
          field: field,
          message: error.text
        })
      }
    })
  }

  const importPermitIssueDateErrorMessage = importPermitIssueDateErrors[0]?.message

  const importPermitIssueDateComponents = [
    { name: "day", value: data.importPermitIssueDateDay },
    { name: "month", value: data.importPermitIssueDateMonth },
    { name: "year", value: data.importPermitIssueDateYear }
  ]

  const inputPermitNumber = {
    label: {
      text: pageContent.inputLabelPermitNumber
    },
    id: "importPermitNumber",
    name: "importPermitNumber",
    classes: "govuk-input govuk-input--width-20",
    autocomplete: "on",
    ...(data.importPermitNumber
      ? { value: data.importPermitNumber }
      : {}),
    errorMessage: getFieldError(errorList, "#importPermitNumber")
  }

  const inputPermitIssueDate = {
    id: "importPermitIssueDate",
    name: "importPermitIssueDate",
    namePrefix: "importPermitIssueDate",
    fieldset: {
      legend: {
        text: pageContent.inputLabelPermitIssueDate
      }
    },
    hint: {
      text: pageContent.inputLabelHintPermitIssueDate
    },
    items: getPermitIssueDateInputGroupItems(
      importPermitIssueDateComponents,
      importPermitIssueDateErrors
    ),
    errorMessage: importPermitIssueDateErrorMessage
      ? { html: importPermitIssueDateErrorMessage }
      : null
  }

  const checkboxNotKnown = {
    idPrefix: "importPermitDetailsNotKnown",
    name: "importPermitDetailsNotKnown",
    items: [
      {
        value: true,
        text: pageContent.checkboxLabelNotKnown,
        checked: data.importPermitDetailsNotKnown
      }
    ],
    errorMessage: getFieldError(errorList, "#importPermitDetailsNotKnown")
  }

  const model = {
    backLink: backLink,
    assetPath,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    pageBody: pageContent.pageBody,
    divider: pageContent.dividerText,
    inputPermitNumber,
    inputPermitIssueDate,
    checkboxNotKnown
  }
  return { ...commonContent, ...model }
}

function getPermitIssueDateInputGroupItems(components, permitIssueDateErrors) {
  return components.map((component) => {
    let classes =
      component.name === "year"
        ? "govuk-input--width-4"
        : "govuk-input--width-2"

    const inputError = permitIssueDateErrors.filter(
      (item) =>
        item.field.includes("-" + component.name) ||
        item.field === "importPermitIssueDate"
    )
    if (inputError.length) {
      classes += " govuk-input--error"
    }
    return { name: component.name, classes: classes, value: component.value }
  })
}

function permitIssueDateValidator(value, helpers) {

  const day = value[permitIssueDateFieldItems.DAY]
  const month = value[permitIssueDateFieldItems.MONTH]
  const year = value[permitIssueDateFieldItems.YEAR]
  const fieldName = permitIssueDateFieldItems.DATE
  const dateValidatorResponse = dateValidator(day, month, year, false, fieldName, helpers)

  return dateValidatorResponse === null ? value : dateValidatorResponse

}

const payloadSchema = Joi.object({
  //isExportOrReexportSameAsCountryOfOrigin: Joi.boolean().default(false),

  importPermitNumber: Joi.when("importPermitDetailsNotKnown", {
    is: false,
    then: Joi.string().min(1).max(27).regex(COMMENTS_REGEX).required(),
    //otherwise: Joi.string().length(0)
  }),
  importPermitIssueDate: Joi.when("importPermitDetailsNotKnown", {
    is: false,
    then: Joi.object({
      "importPermitIssueDate-day": Joi.any().optional(),
      "importPermitIssueDate-month": Joi.any().optional(),
      "importPermitIssueDate-year": Joi.any().optional()
    }).custom(permitIssueDateValidator),
  }),
  importPermitDetailsNotKnown: Joi.boolean().default(false)
})

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
      const { applicationIndex } = request.params
      const submission = getSubmission(request)

      try {
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const permitDetails = submission.applications[applicationIndex].permitDetails

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        importPermitNumber: permitDetails?.importPermitNumber,
        importPermitIssueDateDay: permitDetails?.importPermitIssueDate?.day,
        importPermitIssueDateMonth: permitDetails?.importPermitIssueDate?.month,
        importPermitIssueDateYear: permitDetails?.importPermitIssueDate?.year,
        importPermitDetailsNotKnown: permitDetails?.importPermitDetailsNotKnown,

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
        //Payload validation done in handler section
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const {
          importPermitNumber,
          "importPermitIssueDate-day": importDay,
          "importPermitIssueDate-month": importMonth,
          "importPermitIssueDate-year": importYear,
        } = request.payload
        const importPermitDetailsNotKnown = stringToBool(request.payload.importPermitDetailsNotKnown, false)


        const requestPayload = {
          importPermitNumber: importPermitNumber,
          importPermitIssueDate: {
            "importPermitIssueDate-day": importDay,
            "importPermitIssueDate-month": importMonth,
            "importPermitIssueDate-year": importYear,
          },
          importPermitDetailsNotKnown: importPermitDetailsNotKnown || false
        }

        const result = payloadSchema.validate(requestPayload, { abortEarly: false })

        if (result.error) {
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            importPermitNumber: importPermitNumber,
            importPermitIssueDateDay: importDay,
            importPermitIssueDateMonth: importMonth,
            importPermitIssueDateYear: importYear,
            importPermitDetailsNotKnown
          }
          return h.view(viewName, createModel(result.error, pageData)).takeover()
        }

        const permitDetails = submission.applications[applicationIndex].permitDetails || {}

        permitDetails.importPermitDetailsNotKnown = importPermitDetailsNotKnown || false

        if (permitDetails.importPermitDetailsNotKnown) {
          permitDetails.importPermitNumber = null
          permitDetails.importPermitIssueDate = null
        } else {
          permitDetails.importPermitNumber = importPermitNumber
          permitDetails.importPermitIssueDate = {
            day: parseInt(importDay),
            month: parseInt(importMonth),
            year: parseInt(importYear)
          }
        }

        submission.applications[applicationIndex].permitDetails = permitDetails

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        const redirectTo = `${nextPath}/${applicationIndex}`

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]

