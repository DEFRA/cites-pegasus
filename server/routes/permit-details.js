const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const { dateValidator, emptyDateValidator } = require("../lib/validators")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "permit-details"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathImporterExporter = `${urlPrefix}/importer-exporter`
const previousPathEverImportedExported = `${urlPrefix}/ever-imported-exported`
const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const nextPath = `${urlPrefix}/additional-info`
const invalidSubmissionPath = `${urlPrefix}/`
const assetPath = `${urlPrefix}/assets`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.permitDetails

  let headingImportReexportA10 = ''
  switch (data.permitType) {
    case pt.IMPORT:
      headingImportReexportA10 = pageContent.headingImport;
      break
    case pt.MIC:
    case pt.TEC:
    case pt.POC:
    case pt.REEXPORT:
    case pt.ARTICLE_10:
      headingImportReexportA10 = pageContent.headingReexportA10;
      break
    default:
      break
  }

  let previousPath
  if (data.isEverImportedExported) {
    previousPath = previousPathEverImportedExported
  } else if (data.permitType === pt.REEXPORT && data.otherPermitTypeOption === pto.SEMI_COMPLETE) {
    previousPath = data.sex ? previousPathDescribeLivingAnimal : previousPathDescribeSpecimen
  } else {
    previousPath = previousPathImporterExporter
  }

  let exportOrReexportPermitIssueDateErrors = []
  let countryOfOriginPermitIssueDateErrors = []

  let errorList = null

  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = [
      "exportOrReexportCountry",
      "exportOrReexportPermitNumber",
      "exportOrReexportPermitIssueDate",
      // "exportOrReexportPermitIssueDate.exportOrReexportPermitIssueDate-day",
      // "exportOrReexportPermitIssueDate.exportOrReexportPermitIssueDate-month",
      // "exportOrReexportPermitIssueDate.exportOrReexportPermitIssueDate-year",
      "exportOrReexportPermitIssueDate-day",
      "exportOrReexportPermitIssueDate-day-month",
      "exportOrReexportPermitIssueDate-day-year",
      "exportOrReexportPermitIssueDate-month",
      "exportOrReexportPermitIssueDate-month-year",
      "exportOrReexportPermitIssueDate-year",
      "countryOfOrigin",
      "countryOfOriginPermitNumber",
      "countryOfOriginPermitIssueDate",
      // "countryOfOriginPermitIssueDate.countryOfOriginPermitIssueDate-day",
      // "countryOfOriginPermitIssueDate.countryOfOriginPermitIssueDate-month",
      // "countryOfOriginPermitIssueDate.countryOfOriginPermitIssueDate-year",
      "countryOfOriginPermitIssueDate-day",
      "countryOfOriginPermitIssueDate-day",
      "countryOfOriginPermitIssueDate-day-month",
      "countryOfOriginPermitIssueDate-day-year",
      "countryOfOriginPermitIssueDate-month",
      "countryOfOriginPermitIssueDate-month-year",
      "countryOfOriginPermitIssueDate-year"
    ]
    fields.forEach((field) => {
      const fieldError = findErrorList(errors, [field], mergedErrorMessages)[0]
      if (fieldError) {
        errorList.push({
          text: fieldError,
          href: `#${field}`
        })
      }
    })
  }

  if (errorList) {
    const permitIssueDateFields = [
      "exportOrReexportPermitIssueDate",
      "exportOrReexportPermitIssueDate-day",
      "exportOrReexportPermitIssueDate-day-month",
      "exportOrReexportPermitIssueDate-day-year",
      "exportOrReexportPermitIssueDate-month",
      "exportOrReexportPermitIssueDate-month-year",
      "exportOrReexportPermitIssueDate-year",
      "countryOfOriginPermitIssueDate",
      "countryOfOriginPermitIssueDate-day",
      "countryOfOriginPermitIssueDate-day-month",
      "countryOfOriginPermitIssueDate-day-year",
      "countryOfOriginPermitIssueDate-month",
      "countryOfOriginPermitIssueDate-month-year",
      "countryOfOriginPermitIssueDate-year"
    ]
    permitIssueDateFields.forEach((field) => {
      const error = getFieldError(errorList, "#" + field)
      if (error && field.includes("exportOrReexportPermitIssueDate")) {
        exportOrReexportPermitIssueDateErrors.push({
          field: field,
          message: error.text
        })
      } else if (error && field.includes("countryOfOriginPermitIssueDate")) {
        countryOfOriginPermitIssueDateErrors.push({
          field: field,
          message: error.text
        })
      }
    })
  }

  const exportOrReexportPermitIssueDateErrorMessage =
    exportOrReexportPermitIssueDateErrors[0]?.message

  const countryOfOriginPermitIssueDateErrorMessage =
    countryOfOriginPermitIssueDateErrors[0]?.message

  const exportOrReexportPermitIssueDateComponents = [
    { name: "day", value: data.exportOrReexportPermitIssueDateDay },
    { name: "month", value: data.exportOrReexportPermitIssueDateMonth },
    { name: "year", value: data.exportOrReexportPermitIssueDateYear }
  ]

  const countryOfOriginPermitIssueDateComponents = [
    { name: "day", value: data.countryOfOriginPermitIssueDateDay },
    { name: "month", value: data.countryOfOriginPermitIssueDateMonth },
    { name: "year", value: data.countryOfOriginPermitIssueDateYear }
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

  const countryOfOriginCountries = countries.map(country => {
    return {
      value: country.code,
      text: country.name,
      selected: country.code === (data.countryOfOrigin || '')
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

  const checkboxExportOrReexportSameAsCountryOfOrigin = {
    idPrefix: "isExportOrReexportSameAsCountryOfOrigin",
    name: "isExportOrReexportSameAsCountryOfOrigin",
    items: [
      {
        value: true,
        text: pageContent.checkboxLabelSameAsCountryOfOrigin,
        checked: data.isExportOrReexportSameAsCountryOfOrigin
      }
    ]
  }

  const selectCountryOfOrigin = {
    label: {
      text: pageContent.inputLabelCountry
    },
    id: "countryOfOrigin",
    name: "countryOfOrigin",
    classes: "govuk-!-width-two-thirds",
    items: countryOfOriginCountries,
    //...(data.countryOfOrigin ? { value: data.countryOfOrigin } : {}),
    errorMessage: getFieldError(errorList, "#countryOfOrigin")
  }

  const inputCountryOfOriginPermitNumber = {
    label: {
      text: pageContent.inputLabelPermitNumber
    },
    id: "countryOfOriginPermitNumber",
    name: "countryOfOriginPermitNumber",
    classes: "govuk-input govuk-input--width-20",
    autocomplete: "on",
    ...(data.countryOfOriginPermitNumber
      ? { value: data.countryOfOriginPermitNumber }
      : {}),
    errorMessage: getFieldError(errorList, "#countryOfOriginPermitNumber")
  }

  const inputCountryOfOriginPermitIssueDate = {
    id: "countryOfOriginPermitIssueDate",
    name: "countryOfOriginPermitIssueDate",
    namePrefix: "countryOfOriginPermitIssueDate",
    fieldset: {
      legend: {
        text: pageContent.inputLabelPermitIssueDate
      }
    },
    hint: {
      text: pageContent.inputLabelHintPermitIssueDate
    },
    items: getPermitIssueDateInputGroupItems(
      countryOfOriginPermitIssueDateComponents,
      countryOfOriginPermitIssueDateErrors
    ),
    errorMessage: countryOfOriginPermitIssueDateErrorMessage
      ? { html: countryOfOriginPermitIssueDateErrorMessage }
      : null
  }

  const checkboxCountryOfOriginNotKnown = {
    idPrefix: "isCountryOfOriginNotKnown",
    name: "isCountryOfOriginNotKnown",
    items: [
      {
        value: true,
        text: pageContent.checkboxLabelCountryOfOriginNotKnown,
        checked: data.isCountryOfOriginNotKnown
      }
    ]
  }

  const model = {
    backLink: backLink,
    assetPath,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    hintImportReexportA10: pageContent.hintImportReexportA10,
    hintCountryOfOrigin: pageContent.hintCountryOfOrigin,
    headingImportReexportA10,
    headingCountryOfOrigin: pageContent.headingCountryOfOrigin,
    divider: pageContent.dividerText,
    selectExportOrReexportCountry, 
    inputExportOrReexportPermitNumber,
    inputExportOrReexportPermitIssueDate,
    checkboxExportOrReexportSameAsCountryOfOrigin,
    selectCountryOfOrigin,
    inputCountryOfOriginPermitNumber,
    inputCountryOfOriginPermitIssueDate,
    checkboxCountryOfOriginNotKnown
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
        item.field === "exportOrReexportPermitIssueDate" ||
        item.field === "countryOfOriginPermitIssueDate"
    )
    if (inputError.length) {
      classes += " govuk-input--error"
    }
    return { name: component.name, classes: classes, value: component.value }
  })
}

function permitIssueDateValidator(value, helpers) {
  const { day, month, year, fieldName } = value.hasOwnProperty("exportOrReexportPermitIssueDate-day")
    ? {
      day: value["exportOrReexportPermitIssueDate-day"],
      month: value["exportOrReexportPermitIssueDate-month"],
      year: value["exportOrReexportPermitIssueDate-year"],
      fieldName: "exportOrReexportPermitIssueDate"
    } : {
      day: value["countryOfOriginPermitIssueDate-day"],
      month: value["countryOfOriginPermitIssueDate-month"],
      year: value["countryOfOriginPermitIssueDate-year"],
      fieldName: "countryOfOriginPermitIssueDate"
    }
  const dateValidatorResponse = dateValidator(day, month, year, false, fieldName, helpers)

  return dateValidatorResponse === null ? value : dateValidatorResponse

}

// function permitIssueDateValidatorEmptyDate(value, helpers) {
//   const { day, month, year, fieldName } = value.hasOwnProperty("exportOrReexportPermitIssueDate-day")
//     ? {
//       day: value["exportOrReexportPermitIssueDate-day"],
//       month: value["exportOrReexportPermitIssueDate-month"],
//       year: value["exportOrReexportPermitIssueDate-year"],
//       fieldName: "exportOrReexportPermitIssueDate"
//     } : {
//       day: value["countryOfOriginPermitIssueDate-day"],
//       month: value["countryOfOriginPermitIssueDate-month"],
//       year: value["countryOfOriginPermitIssueDate-year"],
//       fieldName: "countryOfOriginPermitIssueDate"
//     }
//   const dateValidatorResponse = emptyDateValidator(day, month, year, fieldName, helpers)

//   return dateValidatorResponse === null ? value : dateValidatorResponse

// }

const payloadSchema = Joi.object({
  isExportOrReexportSameAsCountryOfOrigin: Joi.boolean().default(false),

  exportOrReexportCountry: Joi.when("isExportOrReexportSameAsCountryOfOrigin", {
    is: false,
    then: Joi.string().max(150).required(),
    //otherwise: Joi.string().pattern(/^$/).allow('', null).required()
  }),
  exportOrReexportPermitNumber: Joi.when("isExportOrReexportSameAsCountryOfOrigin", {
    is: false,
    then: Joi.string().min(1).max(27).regex(COMMENTS_REGEX).required(),
    //otherwise: Joi.string().length(0)
  }),
  exportOrReexportPermitIssueDate: Joi.when("isExportOrReexportSameAsCountryOfOrigin", {
    is: false,
    then: Joi.object({
      "exportOrReexportPermitIssueDate-day": Joi.any().optional(),
      "exportOrReexportPermitIssueDate-month": Joi.any().optional(),
      "exportOrReexportPermitIssueDate-year": Joi.any().optional()
    }).custom(permitIssueDateValidator),
    // otherwise: Joi.object({
    //   "exportOrReexportPermitIssueDate-day": Joi.any().optional(),
    //   "exportOrReexportPermitIssueDate-month": Joi.any().optional(),
    //   "exportOrReexportPermitIssueDate-year": Joi.any().optional()
    // }).custom(permitIssueDateValidatorEmptyDate),
  }),

  isCountryOfOriginNotKnown: Joi.boolean().default(false),
  countryOfOrigin: Joi.when("isCountryOfOriginNotKnown", {
    is: false,
    then: Joi.string().max(150).required(),
    //otherwise: Joi.string().pattern(/^$/).allow('', null).required()
  }),
  countryOfOriginPermitNumber: Joi.when("isCountryOfOriginNotKnown", {
    is: false,
    then: Joi.string().min(1).max(27).regex(COMMENTS_REGEX).required(),
    //otherwise: Joi.string().pattern(/^$/).allow('', null).required()
  }),
  countryOfOriginPermitIssueDate: Joi.when("isCountryOfOriginNotKnown", {
    is: false,
    then: Joi.object({
      "countryOfOriginPermitIssueDate-day": Joi.any().optional(),
      "countryOfOriginPermitIssueDate-month": Joi.any().optional(),
      "countryOfOriginPermitIssueDate-year": Joi.any().optional()
    }).custom(permitIssueDateValidator),
    // otherwise: Joi.object({
    //   "countryOfOriginPermitIssueDate-day": Joi.any().optional(),
    //   "countryOfOriginPermitIssueDate-month": Joi.any().optional(),
    //   "countryOfOriginPermitIssueDate-year": Joi.any().optional()
    // }).custom(permitIssueDateValidatorEmptyDate),
  }),
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
        otherPermitTypeOption: submission.otherPermitTypeOption,
        sex: submission.applications[applicationIndex]?.species.sex,
        isEverImportedExported: submission.applications[applicationIndex]?.species.isEverImportedExported,
        exportOrReexportCountry: permitDetails?.exportOrReexportCountry,
        exportOrReexportPermitNumber: permitDetails?.exportOrReexportPermitNumber,
        exportOrReexportPermitIssueDateDay: permitDetails?.exportOrReexportPermitIssueDate.day,
        exportOrReexportPermitIssueDateMonth: permitDetails?.exportOrReexportPermitIssueDate.month,
        exportOrReexportPermitIssueDateYear: permitDetails?.exportOrReexportPermitIssueDate.year,
        isExportOrReexportSameAsCountryOfOrigin: permitDetails?.isExportOrReexportSameAsCountryOfOrigin,
        countryOfOrigin: permitDetails?.countryOfOrigin,
        countryOfOriginPermitNumber: permitDetails?.countryOfOriginPermitNumber,
        countryOfOriginPermitIssueDateDay: permitDetails?.countryOfOriginPermitIssueDate.day,
        countryOfOriginPermitIssueDateMonth: permitDetails?.countryOfOriginPermitIssueDate.month,
        countryOfOriginPermitIssueDateYear: permitDetails?.countryOfOriginPermitIssueDate.year,
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
          countryOfOrigin,
          countryOfOriginPermitNumber,
          "countryOfOriginPermitIssueDate-day": countryOfOriginDay,
          "countryOfOriginPermitIssueDate-month": countryOfOriginMonth,
          "countryOfOriginPermitIssueDate-year": countryOfOriginYear,
          isExportOrReexportSameAsCountryOfOrigin: isExportOrReexportSameAsCountryOfOrigin,
          isCountryOfOriginNotKnown: isCountryOfOriginNotKnown
        } = request.payload

        const requestPayload = {
          exportOrReexportCountry: exportOrReexportCountry,
          exportOrReexportPermitNumber: exportOrReexportPermitNumber,
          isExportOrReexportSameAsCountryOfOrigin: isExportOrReexportSameAsCountryOfOrigin,
          exportOrReexportPermitIssueDate: {
            "exportOrReexportPermitIssueDate-day": exportOrReexportDay,
            "exportOrReexportPermitIssueDate-month": exportOrReexportMonth,
            "exportOrReexportPermitIssueDate-year": exportOrReexportYear,
          },
          countryOfOrigin: countryOfOrigin,
          countryOfOriginPermitNumber: countryOfOriginPermitNumber,
          isCountryOfOriginNotKnown: isCountryOfOriginNotKnown,
          countryOfOriginPermitIssueDate: {
            "countryOfOriginPermitIssueDate-day": countryOfOriginDay,
            "countryOfOriginPermitIssueDate-month": countryOfOriginMonth,
            "countryOfOriginPermitIssueDate-year": countryOfOriginYear,
          },
        }

        const result = payloadSchema.validate(requestPayload, { abortEarly: false })

        if (result.error) {

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            otherPermitTypeOption: submission.otherPermitTypeOption,
            sex: submission.applications[applicationIndex]?.species.sex,
            isEverImportedExported: submission.applications[applicationIndex]?.species.isEverImportedExported,
            exportOrReexportCountry: exportOrReexportCountry,
            exportOrReexportPermitNumber: exportOrReexportPermitNumber,
            exportOrReexportPermitIssueDateDay: exportOrReexportDay,
            exportOrReexportPermitIssueDateMonth: exportOrReexportMonth,
            exportOrReexportPermitIssueDateYear: exportOrReexportYear,
            isExportOrReexportSameAsCountryOfOrigin: isExportOrReexportSameAsCountryOfOrigin,
            countryOfOrigin: countryOfOrigin,
            countryOfOriginPermitNumber: countryOfOriginPermitNumber,
            countryOfOriginPermitIssueDateDay: countryOfOriginDay,
            countryOfOriginPermitIssueDateMonth: countryOfOriginMonth,
            countryOfOriginPermitIssueDateYear: countryOfOriginYear,
            isCountryOfOriginNotKnown: isCountryOfOriginNotKnown,
            countries: request.server.app.countries
          }
          return h.view(pageId, createModel(result.error, pageData)).takeover()
        }
        const selectedExportOrReexportCountry = request.server.app.countries.find(country => country.code === exportOrReexportCountry)
        const exportOrReexportSection = isExportOrReexportSameAsCountryOfOrigin
          ? {
            exportOrReexportCountry: null,
            exportOrReexportCountryDesc: null,
            exportOrReexportPermitNumber: null,
            exportOrReexportPermitIssueDate: {
              day: null,
              month: null,
              year: null
            },
            isExportOrReexportSameAsCountryOfOrigin: true
          }
          : {
            exportOrReexportCountry: selectedExportOrReexportCountry.code,
            exportOrReexportCountryDesc: selectedExportOrReexportCountry.name,
            exportOrReexportPermitNumber: exportOrReexportPermitNumber,
            exportOrReexportPermitIssueDate: {
              day: parseInt(exportOrReexportDay),
              month: parseInt(exportOrReexportMonth),
              year: parseInt(exportOrReexportYear)
            },
            isExportOrReexportSameAsCountryOfOrigin: false
          }

        const selectedCountryOfOriginCountry = request.server.app.countries.find(country => country.code === countryOfOrigin)
        const countryOfOriginSection = isCountryOfOriginNotKnown
          ? {
            countryOfOrigin: null,
            countryOfOriginDesc: null,
            countryOfOriginPermitNumber: null,
            countryOfOriginPermitIssueDate: {
              day: null,
              month: null,
              year: null
            },
            isCountryOfOriginNotKnown: true
          }
          : {
            countryOfOrigin: selectedCountryOfOriginCountry.code,
            countryOfOriginDesc: selectedCountryOfOriginCountry.name,
            countryOfOriginPermitNumber: countryOfOriginPermitNumber,
            countryOfOriginPermitIssueDate: {
              day: parseInt(countryOfOriginDay),
              month: parseInt(countryOfOriginMonth),
              year: parseInt(countryOfOriginYear)
            },
            isCountryOfOriginNotKnown: false
          }

        const permitDetails = { ...exportOrReexportSection, ...countryOfOriginSection }

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

        const redirectTo = `${nextPath}/${applicationIndex}`

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]

