const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const {
  getSubmission,
  mergeSubmission,
  validateSubmission
} = require("../lib/submission")
const { isValidDate, isPastDate } = require("../lib/validators")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const pageId = "permit-details"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathImporterExporter = `${urlPrefix}/importer-exporter`
const previousPathEverImportedExported = `${urlPrefix}/ever-imported-exported`
const nextPath = `${urlPrefix}/comments`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.permitDetails

  if (data.permitType === "import") {
    heading = pageContent.headingImport
  } else if (
    data.permitType === "reexport" ||
    data.permitType === "article10"
  ) {
    heading = pageContent.headingReexportA10
  }

  const previousPath = data.isEverImportedExported
    ? previousPathEverImportedExported
    : previousPathImporterExporter

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
      "exportOrReexportPermitIssueDate-day",
      "exportOrReexportPermitIssueDate-day-month",
      "exportOrReexportPermitIssueDate-day-year",
      "exportOrReexportPermitIssueDate-month",
      "exportOrReexportPermitIssueDate-month-year",
      "exportOrReexportPermitIssueDate-year",
      "countryOfOrigin",
      "countryOfOriginPermitNumber",
      "countryOfOriginPermitIssueDate",
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


  // const exportOrReexportPermitIssueDateErrorMessage =
  //   exportOrReexportPermitIssueDateErrors[0]
  //     .map((item) => {
  //       return item.message
  //     })
  //     .join('</p> <p class="govuk-error-message">')

  // const countryOfOriginPermitIssueDateErrorMessage =
  //   countryOfOriginPermitIssueDateErrors[0]
  //     .map((item) => {
  //       return item.message
  //     })
  //     .join('</p> <p class="govuk-error-message">')


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

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    headingExportOrReexport: heading,
    headingCountryOfOrigin: pageContent.headingCountryOfOrigin,
    divider: pageContent.dividerText,

    inputExportOrReexportCountry: {
      label: {
        text: pageContent.inputLabelCountry
      },
      id: "exportOrReexportCountry",
      name: "exportOrReexportCountry",
      classes: "govuk-!-width-two-thirds",
      ...(data.exportOrReexportCountry
        ? { value: data.exportOrReexportCountry }
        : {}),
      errorMessage: getFieldError(errorList, "#exportOrReexportCountry")
    },
    inputExportOrReexportPermitNumber: {
      label: {
        text: pageContent.inputLabelPermitNumber
      },
      id: "exportOrReexportPermitNumber",
      name: "exportOrReexportPermitNumber",
      classes: "govuk-input govuk-input--width-20",
      ...(data.exportOrReexportPermitNumber
        ? { value: data.exportOrReexportPermitNumber }
        : {}),
      errorMessage: getFieldError(errorList, "#exportOrReexportPermitNumber")
    },
    inputExportOrReexportPermitIssueDate: {
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
    },
    checkboxExportOrReexportNotApplicable: {
      idPrefix: "isExportOrReexportNotApplicable",
      name: "isExportOrReexportNotApplicable",
      items: [
        {
          value: true,
          text: pageContent.checkboxLabelNotApplicable,
          checked: data.isExportOrReexportNotApplicable
        }
      ]
    },

    inputCountryOfOrigin: {
      label: {
        text: pageContent.inputLabelCountry
      },
      id: "countryOfOrigin",
      name: "countryOfOrigin",
      classes: "govuk-!-width-two-thirds",
      ...(data.countryOfOrigin ? { value: data.countryOfOrigin } : {}),
      errorMessage: getFieldError(errorList, "#countryOfOrigin")
    },
    inputCountryOfOriginPermitNumber: {
      label: {
        text: pageContent.inputLabelPermitNumber
      },
      id: "countryOfOriginPermitNumber",
      name: "countryOfOriginPermitNumber",
      classes: "govuk-input govuk-input--width-20",
      ...(data.countryOfOriginPermitNumber
        ? { value: data.countryOfOriginPermitNumber }
        : {}),
      errorMessage: getFieldError(errorList, "#countryOfOriginPermitNumber")
    },
    inputCountryOfOriginPermitIssueDate: {
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
    },
    checkboxCountryOfOriginNotApplicable: {
      idPrefix: "isCountryOfOriginNotApplicable",
      name: "isCountryOfOriginNotApplicable",
      items: [
        {
          value: true,
          text: pageContent.checkboxLabelNotApplicable,
          checked: data.isCountryOfOriginNotApplicable
        }
      ]
    }
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
  const {day, month, year, customLabelPrefix} = value.hasOwnProperty("exportOrReexportPermitIssueDate-day")
    ? {
        day: value["exportOrReexportPermitIssueDate-day"],
        month: value["exportOrReexportPermitIssueDate-month"],
        year: value["exportOrReexportPermitIssueDate-year"],
        customLabelPrefix: "exportOrReexportPermitIssueDate"
      } : {
        day: value["countryOfOriginPermitIssueDate-day"],
        month:  value["countryOfOriginPermitIssueDate-month"],
        year:  value["countryOfOriginPermitIssueDate-year"],
        customLabelPrefix: "countryOfOriginPermitIssueDate"
}
 
    if (!day && !month && !year) {
      return helpers.error("any.empty", { customLabel: customLabelPrefix })
    }
    if (!day && !month) {
      return helpers.error("any.empty", { customLabel: `${customLabelPrefix}-day-month` })
    }
    if (!day && !year) {
      return helpers.error("any.empty", { customLabel: `${customLabelPrefix}-day-year` })
    }
    if (!month && !year) {
      return helpers.error("any.empty", { customLabel: `${customLabelPrefix}-month-year` })
    }
    if (!day) {
      return helpers.error("any.empty", { customLabel: `${customLabelPrefix}-day` })
    }
    if (!month) {
      return helpers.error("any.empty", { customLabel: `${customLabelPrefix}-month` })
    }
    if (!year) {
      return helpers.error("any.empty", { customLabel: `${customLabelPrefix}-year` })
    }
    if (
      !isValidDate( day, month, year  ) ) {
      return helpers.error("any.invalid", {  customLabel: customLabelPrefix  })
    } else {
      const date = new Date( year, month - 1, day )
      if (!isPastDate(date, true)) {
        return helpers.error("any.future", { customLabel: customLabelPrefix  })
      }
    }
  return value
}

const payloadSchema = Joi.object({
  isExportOrReexportNotApplicable: Joi.boolean().default(false),
 
  exportOrReexportCountry: Joi.when("isExportOrReexportNotApplicable", {
    is: false,
    then: Joi.string().max(150).required()}),
  exportOrReexportPermitNumber: Joi.when( "isExportOrReexportNotApplicable", {
     is: false,
     then: Joi.string().min(5).max(27).regex(COMMENTS_REGEX).required()}),
  exportOrReexportPermitIssueDate: Joi.when( "isExportOrReexportNotApplicable", {
     is: false,
     then: Joi.object({
          "exportOrReexportPermitIssueDate-day": Joi.any().optional(),
          "exportOrReexportPermitIssueDate-month": Joi.any().optional(),
          "exportOrReexportPermitIssueDate-year": Joi.any().optional(),
        }).custom(permitIssueDateValidator) }), 

  isCountryOfOriginNotApplicable: Joi.boolean().default(false),
  countryOfOrigin: Joi.when("isCountryOfOriginNotApplicable", {
     is: false,
     then: Joi.string().max(150).required()}),
  countryOfOriginPermitNumber: Joi.when( "isCountryOfOriginNotApplicable", {
      is: false,
      then: Joi.string().min(5).max(27).regex(COMMENTS_REGEX).required() }),
  countryOfOriginPermitIssueDate: Joi.when( "isCountryOfOriginNotApplicable", {
     is: false,
     then: Joi.object({
         "countryOfOriginPermitIssueDate-day": Joi.any().optional(),
         "countryOfOriginPermitIssueDate-month": Joi.any().optional(),
         "countryOfOriginPermitIssueDate-year": Joi.any().optional()
        }).custom(permitIssueDateValidator) }),
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
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const permitDetails =
        submission.applications[applicationIndex].permitDetails

      const pageData = {
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        isEverImportedExported: submission.applications[applicationIndex]?.species.isEverImportedExported,
        exportOrReexportCountry: permitDetails?.exportOrReexportCountry,
        exportOrReexportPermitNumber: permitDetails?.exportOrReexportPermitNumber,
        exportOrReexportPermitIssueDateDay: permitDetails?.exportOrReexportPermitIssueDate.day,
        exportOrReexportPermitIssueDateMonth: permitDetails?.exportOrReexportPermitIssueDate.month,
        exportOrReexportPermitIssueDateYear: permitDetails?.exportOrReexportPermitIssueDate.year,
        isExportOrReexportNotApplicable: permitDetails?.isExportOrReexportNotApplicable,
        countryOfOrigin: permitDetails?.countryOfOrigin,
        countryOfOriginPermitNumber: permitDetails?.countryOfOriginPermitNumber,
        countryOfOriginPermitIssueDateDay: permitDetails?.countryOfOriginPermitIssueDate.day,
        countryOfOriginPermitIssueDateMonth: permitDetails?.countryOfOriginPermitIssueDate.month,
        countryOfOriginPermitIssueDateYear: permitDetails?.countryOfOriginPermitIssueDate.year,
        isCountryOfOriginNotApplicable: permitDetails?.isCountryOfOriginNotApplicable
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
          isExportOrReexportNotApplicable,
          isCountryOfOriginNotApplicable
        } = request.payload

        const requestPayload = {
          exportOrReexportCountry: exportOrReexportCountry,
          exportOrReexportPermitNumber: exportOrReexportPermitNumber,
          isExportOrReexportNotApplicable: isExportOrReexportNotApplicable,
          exportOrReexportPermitIssueDate: {
            "exportOrReexportPermitIssueDate-day": exportOrReexportDay,
            "exportOrReexportPermitIssueDate-month": exportOrReexportMonth,
            "exportOrReexportPermitIssueDate-year": exportOrReexportYear,
          },
          countryOfOrigin: countryOfOrigin,
          countryOfOriginPermitNumber: countryOfOriginPermitNumber,
          isCountryOfOriginNotApplicable: isCountryOfOriginNotApplicable,
          countryOfOriginPermitIssueDate: {
            "countryOfOriginPermitIssueDate-day": countryOfOriginDay,
          "countryOfOriginPermitIssueDate-month": countryOfOriginMonth,
          "countryOfOriginPermitIssueDate-year": countryOfOriginYear,
          },
        }

          const result = payloadSchema.validate(requestPayload, { abortEarly: false })

          if (result.error) {
            const { applicationIndex } = request.params
            const submission = getSubmission(request)
  
            const pageData = {
              applicationIndex: applicationIndex,
              permitType: submission.permitType,
              isEverImportedExported: submission.applications[applicationIndex]?.species.isEverImportedExported,
              exportOrReexportCountry: exportOrReexportCountry,
              exportOrReexportPermitNumber: exportOrReexportPermitNumber,
              exportOrReexportPermitIssueDateDay: exportOrReexportDay,
              exportOrReexportPermitIssueDateMonth: exportOrReexportMonth,
              exportOrReexportPermitIssueDateYear: exportOrReexportYear,
              isExportOrReexportNotApplicable: isExportOrReexportNotApplicable,
              countryOfOrigin: countryOfOrigin,
              countryOfOriginPermitNumber: countryOfOriginPermitNumber,
              countryOfOriginPermitIssueDateDay: countryOfOriginDay,
              countryOfOriginPermitIssueDateMonth: countryOfOriginMonth,
              countryOfOriginPermitIssueDateYear: countryOfOriginYear,
              isCountryOfOriginNotApplicable: isCountryOfOriginNotApplicable
            }
              return h.view(pageId, createModel(result.error, pageData)).takeover()
          }

        const exportOrReexportSection = isExportOrReexportNotApplicable
          ? {
              exportOrReexportCountry: null,
              exportOrReexportPermitNumber: null,
              exportOrReexportPermitIssueDate: {
                day: null,
                month: null,
                year: null
              },
              isExportOrReexportNotApplicable: true
            }
          : {
              exportOrReexportCountry: exportOrReexportCountry,
              exportOrReexportPermitNumber: exportOrReexportPermitNumber,
              exportOrReexportPermitIssueDate: {
                day: parseInt(exportOrReexportDay),
                month: parseInt(exportOrReexportMonth),
                year: parseInt(exportOrReexportYear)
              },
              isExportOrReexportNotApplicable: false
            }

        const countryOfOriginSection = isCountryOfOriginNotApplicable
          ? {
              countryOfOrigin: null,
              countryOfOriginPermitNumber: null,
              countryOfOriginPermitIssueDate: {
                day: null,
                month: null,
                year: null
              },
              isCountryOfOriginNotApplicable: true
            }
          : {
              countryOfOrigin: countryOfOrigin,
              countryOfOriginPermitNumber: countryOfOriginPermitNumber,
              countryOfOriginPermitIssueDate: {
                day: parseInt(countryOfOriginDay),
                month: parseInt(countryOfOriginMonth),
                year: parseInt(countryOfOriginYear)
              },
              isCountryOfOriginNotApplicable: false
            }

        const permitDetails = {...exportOrReexportSection, ...countryOfOriginSection}

        submission.applications[applicationIndex].permitDetails = permitDetails

        try {
          mergeSubmission(
            request,
            { applications: submission.applications },
            `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }
        return h.redirect(`${nextPath}/${applicationIndex}`)
      }
    }
  }
]

