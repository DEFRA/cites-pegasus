const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError, stringToBool } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const { dateValidator, emptyDateValidator } = require("../lib/validators")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "export-permit-details"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathOriginPermitDetails = `${urlPrefix}/origin-permit-details`
const previousPathCountryOfOriginImport = `${urlPrefix}/country-of-origin-import`
const nextPathImportPermitDetails = `${urlPrefix}/import-permit-details`
const nextPathAdditionalInfo = `${urlPrefix}/additional-info`
const invalidSubmissionPath = `${urlPrefix}/`
const assetPath = `${urlPrefix}/assets`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.exportPermitDetails

  let previousPath = previousPathOriginPermitDetails
  if (data.isExportOrReexportSameAsCountryOfOrigin === false && data.permitType === pt.IMPORT && data.isCountryOfOriginNotKnown === false) {
    previousPath = previousPathCountryOfOriginImport
  }

  let exportOrReexportPermitIssueDateErrors = []

  const errorList = getErrorList(
    errors,
    { ...commonContent.errorMessages, ...pageContent.errorMessages },
    ["exportOrReexportCountry",
      "exportOrReexportPermitNumber",
      "exportOrReexportPermitIssueDate",
      "exportOrReexportPermitIssueDate-day",
      "exportOrReexportPermitIssueDate-day-month",
      "exportOrReexportPermitIssueDate-day-year",
      "exportOrReexportPermitIssueDate-month",
      "exportOrReexportPermitIssueDate-month-year",
      "exportOrReexportPermitIssueDate-year",
      "exportOrReexportPermitDetailsNotKnown"]
  )

  if (errorList) {
    const permitIssueDateFields = [
      "exportOrReexportPermitIssueDate",
      "exportOrReexportPermitIssueDate-day",
      "exportOrReexportPermitIssueDate-day-month",
      "exportOrReexportPermitIssueDate-day-year",
      "exportOrReexportPermitIssueDate-month",
      "exportOrReexportPermitIssueDate-month-year",
      "exportOrReexportPermitIssueDate-year"
    ]
    permitIssueDateFields.forEach((field) => {
      const error = getFieldError(errorList, "#" + field)
      if (error && field.includes("exportOrReexportPermitIssueDate")) {
        exportOrReexportPermitIssueDateErrors.push({
          field: field,
          message: error.text
        })
      }
    })
  }

  const exportOrReexportPermitIssueDateErrorMessage = exportOrReexportPermitIssueDateErrors[0]?.message

  const exportOrReexportPermitIssueDateComponents = [
    { name: "day", value: data.exportOrReexportPermitIssueDateDay },
    { name: "month", value: data.exportOrReexportPermitIssueDateMonth },
    { name: "year", value: data.exportOrReexportPermitIssueDateYear }
  ]

  const countries = [{
    code: '',
    name: commonContent.countrySelectDefault
  }]
  countries.push(...data.countries)

  const exportOrReexportCountries = countries.map(country => {
    return {
      value: country.code,
      text: country.name,
      selected: country.code === (data.exportOrReexportCountry || '')
    }
  })

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const selectExportOrReexportCountry = {
    label: {
      text: pageContent.inputLabelCountry
    },
    id: "exportOrReexportCountry",
    name: "exportOrReexportCountry",
    classes: "govuk-!-width-two-thirds",
    items: exportOrReexportCountries,
    //...(data.exportOrReexportCountry ? { value: data.exportOrReexportCountry } : {}),
    errorMessage: getFieldError(errorList, "#exportOrReexportCountry")
  }

  const inputExportOrReexportPermitNumber = {
    label: {
      text: pageContent.inputLabelPermitNumber
    },
    id: "exportOrReexportPermitNumber",
    name: "exportOrReexportPermitNumber",
    classes: "govuk-input govuk-input--width-20",
    autocomplete: "on",
    ...(data.exportOrReexportPermitNumber
      ? { value: data.exportOrReexportPermitNumber }
      : {}),
    errorMessage: getFieldError(errorList, "#exportOrReexportPermitNumber")
  }

  const inputExportOrReexportPermitIssueDate = {
    id: "exportOrReexportPermitIssueDate",
    name: "exportOrReexportPermitIssueDate",
    namePrefix: "exportOrReexportPermitIssueDate",
    fieldset: {
      legend: {
        text: pageContent.inputLabelPermitIssueDate
      }
    },
    hint: {
      text: pageContent.inputLabelHintPermitIssueDate
    },
    items: getPermitIssueDateInputGroupItems(
      exportOrReexportPermitIssueDateComponents,
      exportOrReexportPermitIssueDateErrors
    ),
    errorMessage: exportOrReexportPermitIssueDateErrorMessage
      ? { html: exportOrReexportPermitIssueDateErrorMessage }
      : null
  }

  const checkboxNotKnown = {
    idPrefix: "exportOrReexportPermitDetailsNotKnown",
    name: "exportOrReexportPermitDetailsNotKnown",
    items: [
      {
        value: true,
        text: pageContent.checkboxLabelNotKnown,
        checked: data.exportOrReexportPermitDetailsNotKnown
      }
    ],
    errorMessage: getFieldError(errorList, "#exportOrReexportPermitDetailsNotKnown")
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
    selectExportOrReexportCountry,
    inputExportOrReexportPermitNumber,
    inputExportOrReexportPermitIssueDate,
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
        item.field === "exportOrReexportPermitIssueDate"
    )
    if (inputError.length) {
      classes += " govuk-input--error"
    }
    return { name: component.name, classes: classes, value: component.value }
  })
}

function permitIssueDateValidator(value, helpers) {
  const day = value["exportOrReexportPermitIssueDate-day"]
  const month = value["exportOrReexportPermitIssueDate-month"]
  const year = value["exportOrReexportPermitIssueDate-year"]
  const fieldName = "exportOrReexportPermitIssueDate"
  const dateValidatorResponse = dateValidator(day, month, year, false, fieldName, helpers)

  return dateValidatorResponse === null ? value : dateValidatorResponse
}

const payloadSchema = Joi.object({
  //isExportOrReexportSameAsCountryOfOrigin: Joi.boolean().default(false),

  exportOrReexportCountry: Joi.when("exportOrReexportPermitDetailsNotKnown", {
    is: false,
    then: Joi.string().max(150).required(),
    //otherwise: Joi.string().pattern(/^$/).allow('', null).required()
  }),
  exportOrReexportPermitNumber: Joi.when("exportOrReexportPermitDetailsNotKnown", {
    is: false,
    then: Joi.string().min(1).max(27).regex(COMMENTS_REGEX).required(),
    //otherwise: Joi.string().length(0)
  }),
  exportOrReexportPermitIssueDate: Joi.when("exportOrReexportPermitDetailsNotKnown", {
    is: false,
    then: Joi.object({
      "exportOrReexportPermitIssueDate-day": Joi.any().optional(),
      "exportOrReexportPermitIssueDate-month": Joi.any().optional(),
      "exportOrReexportPermitIssueDate-year": Joi.any().optional()
    }).custom(permitIssueDateValidator),
  }),

  exportOrReexportPermitDetailsNotKnown: Joi.boolean().default(false),
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
        exportOrReexportCountry: permitDetails?.exportOrReexportCountry,
        exportOrReexportPermitNumber: permitDetails?.exportOrReexportPermitNumber,
        exportOrReexportPermitIssueDateDay: permitDetails?.exportOrReexportPermitIssueDate?.day,
        exportOrReexportPermitIssueDateMonth: permitDetails?.exportOrReexportPermitIssueDate?.month,
        exportOrReexportPermitIssueDateYear: permitDetails?.exportOrReexportPermitIssueDate?.year,
        exportOrReexportPermitDetailsNotKnown: permitDetails?.exportOrReexportPermitDetailsNotKnown,
        isExportOrReexportSameAsCountryOfOrigin: permitDetails?.isExportOrReexportSameAsCountryOfOrigin,
        isCountryOfOriginNotKnown: permitDetails?.isCountryOfOriginNotKnown,
        countries: request.server.app.countries
      }
      return h.view(pageId, createModel(null, pageData))
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
          exportOrReexportCountry,
          exportOrReexportPermitNumber,
          "exportOrReexportPermitIssueDate-day": exportOrReexportDay,
          "exportOrReexportPermitIssueDate-month": exportOrReexportMonth,
          "exportOrReexportPermitIssueDate-year": exportOrReexportYear,
        } = request.payload

        const exportOrReexportPermitDetailsNotKnown = stringToBool(request.payload.exportOrReexportPermitDetailsNotKnown, false)

        const requestPayload = {
          exportOrReexportCountry: exportOrReexportCountry,
          exportOrReexportPermitNumber: exportOrReexportPermitNumber,
          exportOrReexportPermitDetailsNotKnown: exportOrReexportPermitDetailsNotKnown || false,
          exportOrReexportPermitIssueDate: {
            "exportOrReexportPermitIssueDate-day": exportOrReexportDay,
            "exportOrReexportPermitIssueDate-month": exportOrReexportMonth,
            "exportOrReexportPermitIssueDate-year": exportOrReexportYear,
          }
        }

        const result = payloadSchema.validate(requestPayload, { abortEarly: false })

        if (result.error) {

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            exportOrReexportCountry: exportOrReexportCountry,
            exportOrReexportPermitNumber: exportOrReexportPermitNumber,
            exportOrReexportPermitIssueDateDay: exportOrReexportDay,
            exportOrReexportPermitIssueDateMonth: exportOrReexportMonth,
            exportOrReexportPermitIssueDateYear: exportOrReexportYear,
            exportOrReexportPermitDetailsNotKnown,
            isExportOrReexportSameAsCountryOfOrigin: submission.permitDetails?.isExportOrReexportSameAsCountryOfOrigin,
            isCountryOfOriginNotKnown: submission.permitDetails?.isCountryOfOriginNotKnown,
            countries: request.server.app.countries
          }
          return h.view(pageId, createModel(result.error, pageData)).takeover()
        }
        const selectedExportOrReexportCountry = request.server.app.countries.find(country => country.code === exportOrReexportCountry)


        const permitDetails = submission.applications[applicationIndex].permitDetails || {}

        permitDetails.exportOrReexportPermitDetailsNotKnown = exportOrReexportPermitDetailsNotKnown || false

        if (permitDetails.exportOrReexportPermitDetailsNotKnown) {
          permitDetails.exportOrReexportCountry = null
          permitDetails.exportOrReexportCountryDesc = null
          permitDetails.exportOrReexportPermitNumber = null
          permitDetails.exportOrReexportPermitIssueDate = {
            day: null,
            month: null,
            year: null
          }
        } else {
          permitDetails.exportOrReexportCountry = selectedExportOrReexportCountry.code
          permitDetails.exportOrReexportCountryDesc = selectedExportOrReexportCountry.name
          permitDetails.exportOrReexportPermitNumber = exportOrReexportPermitNumber
          permitDetails.exportOrReexportPermitIssueDate = {
            day: parseInt(exportOrReexportDay),
            month: parseInt(exportOrReexportMonth),
            year: parseInt(exportOrReexportYear)
          }
        }

        submission.applications[applicationIndex].permitDetails = permitDetails

        try {
          mergeSubmission(
            request,
            { applications: submission.applications },
            `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        let redirectTo = `${nextPathImportPermitDetails}/${applicationIndex}`

        if (submission.permitType === pt.IMPORT) {
          redirectTo = `${nextPathAdditionalInfo}/${applicationIndex}`
        }

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]

