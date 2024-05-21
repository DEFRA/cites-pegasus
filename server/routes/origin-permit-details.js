const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const { dateValidator, emptyDateValidator } = require("../lib/validators")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "origin-permit-details"
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
  const pageContent = textContent.originPermitDetails

  let previousPath
  // if (data.isEverImportedExported) {
  //   previousPath = previousPathEverImportedExported
  // } else if (data.permitType === pt.REEXPORT && data.otherPermitTypeOption === pto.SEMI_COMPLETE) {
  //   previousPath = data.sex ? previousPathDescribeLivingAnimal : previousPathDescribeSpecimen
  // } else {
  //   previousPath = previousPathImporterExporter
  // }

  let countryOfOriginPermitIssueDateErrors = []

  const errorList = getErrorList(
    errors,
    { ...commonContent.errorMessages, ...pageContent.errorMessages },
    ["countryOfOrigin",
      "countryOfOriginPermitNumber",
      "countryOfOriginPermitIssueDate",
      "countryOfOriginPermitIssueDate-day",
      "countryOfOriginPermitIssueDate-day",
      "countryOfOriginPermitIssueDate-day-month",
      "countryOfOriginPermitIssueDate-day-year",
      "countryOfOriginPermitIssueDate-month",
      "countryOfOriginPermitIssueDate-month-year",
      "countryOfOriginPermitIssueDate-year",
      "isCountryOfOriginNotKnown"]
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
      if (error && field.includes("countryOfOriginPermitIssueDate")) {
        countryOfOriginPermitIssueDateErrors.push({
          field: field,
          message: error.text
        })
      }
    })
  }

  const countryOfOriginPermitIssueDateErrorMessage = countryOfOriginPermitIssueDateErrors[0]?.message

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

  const countryOfOriginCountries = countries.map(country => {
    return {
      value: country.code,
      text: country.name,
      selected: country.code === (data.countryOfOrigin || '')
    }
  })

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
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
        text: pageContent.checkboxLabelNotKnown,
        checked: data.isCountryOfOriginNotKnown
      }
    ]
  }

  const model = {
    backLink: backLink,
    assetPath,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    divider: pageContent.dividerText,
    selectExportOrReexportCountry,
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
        item.field === "countryOfOriginPermitIssueDate"
    )
    if (inputError.length) {
      classes += " govuk-input--error"
    }
    return { name: component.name, classes: classes, value: component.value }
  })
}

function permitIssueDateValidator(value, helpers) {
  const day = value["countryOfOriginPermitIssueDate-day"]
  const month = value["countryOfOriginPermitIssueDate-month"]
  const year = value["countryOfOriginPermitIssueDate-year"]
  const fieldName = "countryOfOriginPermitIssueDate"
  const dateValidatorResponse = dateValidator(day, month, year, false, fieldName, helpers)

  return dateValidatorResponse === null ? value : dateValidatorResponse
}

const payloadSchema = Joi.object({
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
    }).custom(permitIssueDateValidator)
  })  
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
        countryOfOrigin: permitDetails?.countryOfOrigin,
        countryOfOriginPermitNumber: permitDetails?.countryOfOriginPermitNumber,
        countryOfOriginPermitIssueDateDay: permitDetails?.countryOfOriginPermitIssueDate?.day,
        countryOfOriginPermitIssueDateMonth: permitDetails?.countryOfOriginPermitIssueDate?.month,
        countryOfOriginPermitIssueDateYear: permitDetails?.countryOfOriginPermitIssueDate?.year,
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
          isExportOrReexportSameAsCountryOfOrigin,
          isCountryOfOriginNotKnown
        } = request.payload

        const requestPayload = {
          exportOrReexportCountry: exportOrReexportCountry,
          exportOrReexportPermitNumber: exportOrReexportPermitNumber,
          isExportOrReexportSameAsCountryOfOrigin: isExportOrReexportSameAsCountryOfOrigin || false,
          exportOrReexportPermitIssueDate: {
            "exportOrReexportPermitIssueDate-day": exportOrReexportDay,
            "exportOrReexportPermitIssueDate-month": exportOrReexportMonth,
            "exportOrReexportPermitIssueDate-year": exportOrReexportYear,
          },
          countryOfOrigin: countryOfOrigin,
          countryOfOriginPermitNumber: countryOfOriginPermitNumber,
          isCountryOfOriginNotKnown: isCountryOfOriginNotKnown || false,
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
            isExportOrReexportSameAsCountryOfOrigin,
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

