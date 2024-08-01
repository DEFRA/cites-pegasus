const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError, stringToBool, getCountries } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const { dateValidator, dateValidatorMaxDate } = require("../lib/validators")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const permitType = require("./permit-type")
const pageId = "origin-permit-details"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathImporterExporter = `${urlPrefix}/importer-exporter`
const previousPathEverImportedExported = `${urlPrefix}/ever-imported-exported`
const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const nextPathCountryOfOriginImport = `${urlPrefix}/country-of-origin-import`
const nextPathExportPermitDetails = `${urlPrefix}/export-permit-details`
const nextPathImportPermitDetails = `${urlPrefix}/import-permit-details`
const nextPathAdditionalInfo = `${urlPrefix}/additional-info`
const invalidSubmissionPath = `${urlPrefix}/`
const assetPath = `${urlPrefix}/assets`
const permitIssueDateFieldItems = {
  DATE: "countryOfOriginPermitIssueDate",
  DAY: "countryOfOriginPermitIssueDate-day",
  DAY_MONTH: "countryOfOriginPermitIssueDate-day-month",
  DAY_YEAR: "countryOfOriginPermitIssueDate-day-year",
  MONTH: "countryOfOriginPermitIssueDate-month",
  MONTH_YEAR: "countryOfOriginPermitIssueDate-month-year",
  YEAR: "countryOfOriginPermitIssueDate-year"
}

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.originPermitDetails

  let previousPath
  if (data.isEverImportedExported) {
    previousPath = previousPathEverImportedExported
  } else if (data.permitType === pt.REEXPORT && data.otherPermitTypeOption === pto.SEMI_COMPLETE) {
    previousPath = data.sex ? previousPathDescribeLivingAnimal : previousPathDescribeSpecimen
  } else {
    previousPath = previousPathImporterExporter
  }

  const countryOfOriginPermitIssueDateErrors = []


  const errorList = getErrorList(
    errors,
    { ...commonContent.errorMessages, ...pageContent.errorMessages },
    ["countryOfOrigin",
      "countryOfOriginPermitNumber",
      permitIssueDateFieldItems.DATE,
      permitIssueDateFieldItems.DAY,
      permitIssueDateFieldItems.DAY_MONTH,
      permitIssueDateFieldItems.DAY_YEAR,
      permitIssueDateFieldItems.MONTH,
      permitIssueDateFieldItems.MONTH_YEAR,
      permitIssueDateFieldItems.YEAR,
      "isCountryOfOriginNotKnown"]
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

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const selectCountryOfOrigin = {
    label: {
      text: pageContent.inputLabelCountry
    },
    id: "countryOfOrigin",
    name: "countryOfOrigin",
    classes: "govuk-!-width-two-thirds",
    items: getCountries(data.countries, data.countryOfOrigin),
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
        text: data.permitType === pt.IMPORT ? pageContent.checkboxLabelNotKnownImport : pageContent.checkboxLabelNotKnownNotImport,
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
    pageBody: data.permitType === pt.IMPORT ? pageContent.pageBodyImport : pageContent.pageBodyNotImport,
    divider: pageContent.dividerText,
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

function permitIssueDateValidatorNotPlantImport(value, helpers) {
  const { day, month, year, fieldName } = getDatePropertiesFromValue(value)
  const dateValidatorResponse = dateValidator(day, month, year, false, fieldName, helpers)
  return dateValidatorResponse === null ? value : dateValidatorResponse
}

function permitIssueDateValidatorPlantImport(value, helpers) {
  const { day, month, year, fieldName } = getDatePropertiesFromValue(value)
  const maxDate = getMaxDate(31)
  const dateValidatorResponse = dateValidatorMaxDate(day, month, year, true, maxDate, fieldName, helpers)
  return dateValidatorResponse === null ? value : dateValidatorResponse
}

function getDatePropertiesFromValue(value){
  const day = value[permitIssueDateFieldItems.DAY]
  const month = value[permitIssueDateFieldItems.MONTH]
  const year = value[permitIssueDateFieldItems.YEAR]
  const fieldName = permitIssueDateFieldItems.DATE
  return { day, month, year, fieldName }
}

const getMaxDate = (days) => {
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() + days)
  currentDate.setHours(0, 0, 0, 0)

  return currentDate
}

const payloadSchemaNotPlantImport = Joi.object({
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
    }).custom(permitIssueDateValidatorNotPlantImport)
  })
})

const payloadSchemaPlantImport = Joi.object({
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
    }).custom(permitIssueDateValidatorPlantImport)
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
        otherPermitTypeOption: submission.otherPermitTypeOption,
        sex: submission.applications[applicationIndex]?.species.sex,
        isEverImportedExported: submission.applications[applicationIndex]?.species.isEverImportedExported,
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
          countryOfOrigin,
          countryOfOriginPermitNumber,
          "countryOfOriginPermitIssueDate-day": countryOfOriginDay,
          "countryOfOriginPermitIssueDate-month": countryOfOriginMonth,
          "countryOfOriginPermitIssueDate-year": countryOfOriginYear,
        } = request.payload
        const isCountryOfOriginNotKnown = stringToBool(request.payload.isCountryOfOriginNotKnown, false)

        const requestPayload = {
          countryOfOrigin: countryOfOrigin,
          countryOfOriginPermitNumber: countryOfOriginPermitNumber,
          isCountryOfOriginNotKnown: isCountryOfOriginNotKnown,
          countryOfOriginPermitIssueDate: {
            "countryOfOriginPermitIssueDate-day": countryOfOriginDay,
            "countryOfOriginPermitIssueDate-month": countryOfOriginMonth,
            "countryOfOriginPermitIssueDate-year": countryOfOriginYear,
          },
        }

        const payloadSchema = submission.permitType === pt.IMPORT && submission.applications[applicationIndex]?.species.kingdom === 'Plantae' ? payloadSchemaPlantImport : payloadSchemaNotPlantImport

        const result = payloadSchema.validate(requestPayload, { abortEarly: false })

        if (result.error) {

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            otherPermitTypeOption: submission.otherPermitTypeOption,
            sex: submission.applications[applicationIndex]?.species.sex,
            isEverImportedExported: submission.applications[applicationIndex]?.species.isEverImportedExported,
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

        const selectedCountryOfOriginCountry = request.server.app.countries.find(country => country.code === countryOfOrigin)

        const permitDetails = submission.applications[applicationIndex].permitDetails || {}

        permitDetails.isCountryOfOriginNotKnown = isCountryOfOriginNotKnown

        if (permitDetails.isCountryOfOriginNotKnown) {
          permitDetails.countryOfOrigin = null
          permitDetails.countryOfOriginDesc = null
          permitDetails.countryOfOriginPermitNumber = null
          permitDetails.countryOfOriginPermitIssueDate = {
            day: null,
            month: null,
            year: null
          }
          permitDetails.isExportOrReexportSameAsCountryOfOrigin = null
        } else {
          permitDetails.countryOfOrigin = selectedCountryOfOriginCountry.code
          permitDetails.countryOfOriginDesc = selectedCountryOfOriginCountry.name
          permitDetails.countryOfOriginPermitNumber = countryOfOriginPermitNumber
          permitDetails.countryOfOriginPermitIssueDate = {
            day: parseInt(countryOfOriginDay),
            month: parseInt(countryOfOriginMonth),
            year: parseInt(countryOfOriginYear)
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

        let redirectTo = `${nextPathExportPermitDetails}/${applicationIndex}`

        if (submission.permitType === pt.IMPORT) {
          if (!isCountryOfOriginNotKnown) {
            redirectTo = `${nextPathCountryOfOriginImport}/${applicationIndex}`
          }
        } else if (submission.permitType === pt.ARTICLE_10) {
          redirectTo = `${nextPathImportPermitDetails}/${applicationIndex}`
        } else {
          //Do nothing
        }

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]

