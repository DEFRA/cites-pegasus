const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
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

  // let permitIssueDateErrors = []
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

  console.log("exportOrReexportPermitIssueDateErrors", exportOrReexportPermitIssueDateErrors)

  console.log(" countryOfOriginPermitIssueDateErrors",  countryOfOriginPermitIssueDateErrors)

  const exportOrReexportPermitIssueDateErrorMessage = exportOrReexportPermitIssueDateErrors
    .map((item) => { return item.message})
    .join('</p> <p class="govuk-error-message">')

    const countryOfOriginPermitIssueDateErrorMessage = countryOfOriginPermitIssueDateErrors
    .map((item) => { return item.message})
    .join('</p> <p class="govuk-error-message">')

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
      classes: "govuk-!-width-two-thirds",
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
      idPrefix: "exportOrReexportNotApplicable",
      name: "exportOrReexportNotApplicable",
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
      classes: "govuk-!-width-two-thirds",
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
      idPrefix: "countryOfOriginNotApplicable",
      name: "countryOfOriginNotApplicable",
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
  const {
      "exportOrReexportPermitIssueDate-day": exportOrReexportDay,
      "exportOrReexportPermitIssueDate-month": exportOrReexportMonth,
      "exportOrReexportPermitIssueDate-year": exportOrReexportYear,
      "countryOfOriginPermitIssueDate-day": countryOfOriginDay,
      "countryOfOriginPermitIssueDate-month": countryOfOriginMonth,
      "countryOfOriginPermitIssueDate-year": countryOfOriginYear,
      isExportOrReexportNotApplicable,
      isCountryOfOriginNotApplicable
   } = value

  if (!isExportOrReexportNotApplicable) {

    console.log("valuee>>>", value)

    if (!exportOrReexportDay && !exportOrReexportMonth && !exportOrReexportYear) {
      return helpers.error('any.empty', { customLabel: 'exportOrReexportPermitIssueDate' });
    }

    if (!exportOrReexportDay && !exportOrReexportMonth) {
      return helpers.error('any.empty', { customLabel: 'exportOrReexportPermitIssueDate-day-month' });
    }

    if (!exportOrReexportDay && !exportOrReexportYear) {
      return helpers.error('any.empty', { customLabel: 'exportOrReexportPermitIssueDate-day-year' });
    }

    if (!exportOrReexportMonth && !exportOrReexportYear) {
      return helpers.error('any.empty', { customLabel: 'exportOrReexportPermitIssueDate-month-year' });
    }

    if (!exportOrReexportDay) {
      return helpers.error('any.empty', { customLabel: 'exportOrReexportPermitIssueDate-day' });
    }

    if (!exportOrReexportMonth) {
      return helpers.error('any.empty', { customLabel: 'exportOrReexportPermitIssueDate-month' });
    }

    if (!exportOrReexportYear) {
      return helpers.error('any.empty', { customLabel: 'exportOrReexportPermitIssueDate-year' });
    }

    if (!isValidDate(exportOrReexportDay, exportOrReexportMonth, exportOrReexportYear)) {
      return helpers.error('any.invalid', { customLabel: 'exportOrReexportPermitIssueDate' });
    } else {
      const date = new Date(exportOrReexportYear, exportOrReexportMonth - 1, exportOrReexportDay);
      if (!isPastDate(date, true)) {
        return helpers.error('any.future', { customLabel: 'exportOrReexportPermitIssueDate' });
      }
    }
  }

  if (!isCountryOfOriginNotApplicable) {

    if (!countryOfOriginDay && !countryOfOriginMonth && !countryOfOriginYear) {
      return helpers.error('any.empty', { customLabel: 'countryOfOriginPermitIssueDate' });
    }

    if (!countryOfOriginDay && !countryOfOriginMonth) {
      return helpers.error('any.empty', { customLabel: 'countryOfOriginPermitIssueDate-day-month' });
    }

    if (!countryOfOriginDay && !countryOfOriginYear) {
      return helpers.error('any.empty', { customLabel: 'countryOfOriginPermitIssueDate-day-year' });
    }

    if (!countryOfOriginMonth && !countryOfOriginYear) {
      return helpers.error('any.empty', { customLabel: 'countryOfOriginPermitIssueDate-month-year' });
    }

    if (!countryOfOriginDay) {
      return helpers.error('any.empty', { customLabel: 'countryOfOriginPermitIssueDate-day' });
    }

    if (!countryOfOriginMonth) {
      return helpers.error('any.empty', { customLabel: 'countryOfOriginPermitIssueDate-month' });
    }

    if (!countryOfOriginYear) {
      return helpers.error('any.empty', { customLabel: 'countryOfOriginPermitIssueDate-year' });
    }

    if (!isValidDate(countryOfOriginDay, countryOfOriginMonth, countryOfOriginYear)) {
      return helpers.error('any.invalid', { customLabel: 'countryOfOriginPermitIssueDate' });
    } else {
      const date = new Date(countryOfOriginYear, countryOfOriginMonth - 1, countryOfOriginDay);
      if (!isPastDate(date, true)) {
        return helpers.error('any.future', { customLabel: 'countryOfOriginPermitIssueDate' });
      }
    }
  }
  return value
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
      const { applicationIndex } = request.params
      const submission = getSubmission(request)

      try {
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const permitDeatils =
        submission.applications[applicationIndex].permitDeatils

      const pageData = {
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        exportOrReexportCountry: permitDeatils?.exportOrReexportCountry,
        exportOrReexportPermitNumber:
          permitDeatils?.exportOrReexportPermitNumber,
        exportOrReexportPermitIssueDateDay:
          permitDeatils?.exportOrReexportPermitIssueDate.day,
        exportOrReexportPermitIssueDateMonth:
          permitDeatils?.exportOrReexportPermitIssueDate.month,
        exportOrReexportPermitIssueDateYear:
          permitDeatils?.exportOrReexportPermitIssueDate.year,
        isExportOrReexportNotApplicable:
          permitDeatils?.isExportOrReexportNotApplicable,
        countryOfOrigin: permitDeatils?.countryOfOrigin,
        countryOfOriginPermitNumber: permitDeatils?.countryOfOriginPermitNumber,
        countryOfOriginPermitIssueDateDay:
          permitDeatils?.countryOfOriginPermitIssueDate.day,
        countryOfOriginPermitIssueDateMonth:
          permitDeatils?.countryOfOriginPermitIssueDate.month,
        countryOfOriginPermitIssueDateYear:
          permitDeatils?.countryOfOriginPermitIssueDate.year,
        isCountryOfOriginNotApplicable:
          permitDeatils?.isCountryOfOriginNotApplicable
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
        options: { abortEarly: false },
        payload: Joi.object({
          isExportOrReexportNotApplicable: Joi.boolean().default(false),
          isCountryOfOriginNotApplicable: Joi.boolean().default(false),
          exportOrReexportCountry: Joi.when("isExportOrReexportNotApplicable", {
            is: false,
            then: Joi.string().max(150).required(),
          }),
          exportOrReexportPermitNumber: Joi.when("isExportOrReexportNotApplicable", {
            is: false,
            then:  Joi.string().min(5).max(27).regex(COMMENTS_REGEX).required(),
          }),
          countryOfOrigin:  Joi.when("isCountryOfOriginNotApplicable", {
            is: false,
            then: Joi.string().max(150).required(),
          }),
          countryOfOriginPermitNumber: Joi.when("isCountryOfOriginNotApplicable", {
            is: false,
            then:   Joi.string().min(5).max(27).regex(COMMENTS_REGEX).required(),
          }),
            "exportOrReexportPermitIssueDate-day": Joi.any().required(),
            "exportOrReexportPermitIssueDate-month": Joi.any().required(),
            "exportOrReexportPermitIssueDate-year": Joi.any().required(),
            "countryOfOriginPermitIssueDate-day": Joi.any().required(),
            "countryOfOriginPermitIssueDate-month": Joi.any().required(),
            "countryOfOriginPermitIssueDate-year": Joi.any().required()
        }).custom(permitIssueDateValidator),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const pageData = {
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            ...request.payload
          }
          console.log("submission", submission)
          console.log("request.payload", request.payload)
         

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)

        // const exportOrReexportPermitIssueDate = {
        //   "exportOrReexportPermitIssueDate-day": day,
        //   "exportOrReexportPermitIssueDate-month": month,
        //   "exportOrReexportPermitIssueDate-year": year
        // } = request.payload

        //  countryOfOriginPermitIssueDate: {
        //     "countryOfOriginPermitIssueDate-day": countryOfOriginDay,
        //     "countryOfOriginPermitIssueDate-month": countryOfOriginMonth,
        //     "countryOfOriginPermitIssueDate-year": countryOfOriginYear
        //   }
        // } = request.payload

        const {
          exportOrReexportCountry,
          exportOrReexportPermitNumber,
          isExportOrReexportNotApplicable,
          countryOfOrigin,
          countryOfOriginPermitNumber,
          isCountryOfOriginNotApplicable
        } = request.payload

        // const permitDeatils = {
        //   exportOrReexportCountry: exportOrReexportCountry,
        //   exportOrReexportPermitNumber: exportOrReexportPermitNumber,
        //   isExportOrReexportNotApplicable: isExportOrReexportNotApplicable,
        //   countryOfOrigin: countryOfOrigin,
        //   countryOfOriginPermitNumber: countryOfOriginPermitNumber,
        //   isCountryOfOriginNotApplicable: isCountryOfOriginNotApplicable
        // }

        const exportOrReexportSection = isExportOrReexportNotApplicable
          ? {
              exportOrReexportCountry: null,
              exportOrReexportPermitNumber: null,
              isExportOrReexportNotApplicable: true
            }
          : {
              exportOrReexportCountry: exportOrReexportCountry,
              exportOrReexportPermitNumber: exportOrReexportPermitNumber,
              isExportOrReexportNotApplicable: false
            }

        const countryOfOriginSection = isCountryOfOriginNotApplicable
          ? {
              countryOfOrigin: null,
              countryOfOriginPermitNumber: null,
              isCountryOfOriginNotApplicable: true
            }
          : {
              countryOfOrigin: countryOfOrigin,
              countryOfOriginPermitNumber: countryOfOriginPermitNumber,
              isCountryOfOriginNotApplicable: false
            }

        const permitDeatils = exportOrReexportSection.push(
          countryOfOriginSection
        )

        submission.applications[applicationIndex].permitDeatils = permitDeatils

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


// function exportOrReexportPermitIssueDateValidator(value, helpers) {
  //   const {
  //     "exportOrReexportPermitIssueDate-day": day,
  //     "exportOrReexportPermitIssueDate-month": month,
  //     "exportOrReexportPermitIssueDate-year": year
  //   } = value
  
  //   if (!day && !month && !year) {
  //     return helpers.error("any.empty", {
  //       customLabel: "exportOrReexportPermitIssueDate"
  //     })
  //   }
  
  //   if (!day && !month) {
  //     return helpers.error("any.empty", {
  //       customLabel: "exportOrReexportPermitIssueDate-day-month"
  //     })
  //   }
  
  //   if (!day && !year) {
  //     return helpers.error("any.empty", {
  //       customLabel: "exportOrReexportPermitIssueDate-day-year"
  //     })
  //   }
  
  //   if (!month && !year) {
  //     return helpers.error("any.empty", {
  //       customLabel: "exportOrReexportPermitIssueDate-month-year"
  //     })
  //   }
  
  //   if (!day) {
  //     return helpers.error("any.empty", {
  //       customLabel: "exportOrReexportPermitIssueDate-day"
  //     })
  //   }
  
  //   if (!month) {
  //     return helpers.error("any.empty", {
  //       customLabel: "exportOrReexportPermitIssueDate-month"
  //     })
  //   }
  
  //   if (!year) {
  //     return helpers.error("any.empty", {
  //       customLabel: "exportOrReexportPermitIssueDate-year"
  //     })
  //   }
  
  //   if (!isValidDate(day, month, year)) {
  //     return helpers.error("any.invalid", {
  //       customLabel: "exportOrReexportPermitIssueDate"
  //     })
  //   } else {
  //     const date = new Date(year, month - 1, day)
  //     if (!isPastDate(date, true)) {
  //       return helpers.error("any.future", {
  //         customLabel: "exportOrReexportPermitIssueDate"
  //       })
  //     }
  //   }
  //   return value
  // }
  
  // function countryOfOriginPermitIssueDateValidator(value, helpers) {
  //   const {
  //     "countryOfOriginPermitIssueDate-day": day,
  //     "countryOfOriginPermitIssueDate-month": month,
  //     "countryOfOriginPermitIssueDate-year": year
  //   } = value
  
  //   if (!day && !month && !year) {
  //     return helpers.error("any.empty", {
  //       customLabel: "countryOfOriginPermitIssueDate"
  //     })
  //   }
  
  //   if (!day && !month) {
  //     return helpers.error("any.empty", {
  //       customLabel: "countryOfOriginPermitIssueDate-day-month"
  //     })
  //   }
  
  //   if (!day && !year) {
  //     return helpers.error("any.empty", {
  //       customLabel: "countryOfOriginPermitIssueDate-day-year"
  //     })
  //   }
  
  //   if (!month && !year) {
  //     return helpers.error("any.empty", {
  //       customLabel: "countryOfOriginPermitIssueDate-month-year"
  //     })
  //   }
  
  //   if (!day) {
  //     return helpers.error("any.empty", {
  //       customLabel: "countryOfOriginPermitIssueDate-day"
  //     })
  //   }
  
  //   if (!month) {
  //     return helpers.error("any.empty", {
  //       customLabel: "countryOfOriginPermitIssueDate-month"
  //     })
  //   }
  
  //   if (!year) {
  //     return helpers.error("any.empty", {
  //       customLabel: "countryOfOriginPermitIssueDate-year"
  //     })
  //   }
  
  //   if (!isValidDate(day, month, year)) {
  //     return helpers.error("any.invalid", {
  //       customLabel: "countryOfOriginPermitIssueDate"
  //     })
  //   } else {
  //     const date = new Date(year, month - 1, day)
  //     if (!isPastDate(date, true)) {
  //       return helpers.error("any.future", {
  //         customLabel: "countryOfOriginPermitIssueDate"
  //       })
  //     }
  //   }
  //   return value
  // }



