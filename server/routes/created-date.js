const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { checkChangeRouteExit } = require("../lib/change-route")
const { dateValidator } = require("../lib/validators")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "created-date"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/quantity`
const nextPath = `${urlPrefix}/trade-term-code`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.createdDate

  let createdDateErrors = []
  let errorList = null

  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = [
      "createdDate",
      "createdDate-day",
      "createdDate-day-month",
      "createdDate-day-year",
      "createdDate-month",
      "createdDate-month-year",
      "createdDate-year",
      "isExactDateUnknown",
      "approximateDate"
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
    const createdDateFields = [
      "createdDate",
      "createdDate-day",
      "createdDate-day-month",
      "createdDate-day-year",
      "createdDate-month",
      "createdDate-month-year",
      "createdDate-year"
    ]
    createdDateFields.forEach((field) => {
      const error = getFieldError(errorList, "#" + field)
      if (error) {
        createdDateErrors.push({ field: field, message: error.text })
      }
    })
  }

  const createdDateErrorMessage = createdDateErrors.map(item => { return item.message }).join('</p> <p class="govuk-error-message">')

  const createdDateComponents = [
    { name: 'day', value: data.createdDateDay },
    { name: 'month', value: data.createdDateMonth },
    { name: 'year', value: data.createdDateYear }
  ]

  var renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const approximateDateInput = nunjucks.renderString(renderString, {
    input: {
      id: "approximateDate",
      name: "approximateDate",
      classes: "govuk-input govuk-!-width-two-thirds",
      autocomplete: "on",
      label: {
        text: pageContent.inputLabelApproximateDate
      },
      hint: {
        text: pageContent.inputLabelHintApproximateDate
      },
      ...(data.approximateDate
        ? { value: data.approximateDate }
        : {}),
      errorMessage: getFieldError(errorList, "#approximateDate")
    }
  })

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    captionText: data.speciesName,

    inputCreatedDate: {
      id: "createdDate",
      name: "createdDate",
      namePrefix: "createdDate",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      hint: {
        text: pageContent.pageHeaderHint
      },
      items: getCreatedDateInputGroupItems(createdDateComponents, createdDateErrors),
      errorMessage: createdDateErrorMessage ? { html: createdDateErrorMessage } : null
    },

    checkboxIsExactDateUnknown: {
      idPrefix: "isExactDateUnknown",
      name: "isExactDateUnknown",
      classes: "govuk-checkboxes--small",
      items: [
        {
          value: true,
          text: pageContent.checkboxLabelIsExactDateUnknown,
          checked: data.isExactDateUnknown,
          conditional: {
            html: approximateDateInput
          }
        }
      ],
      errorMessage: getFieldError(errorList, "#isExactDateUnknown")
    }
  }
  return { ...commonContent, ...model }
}

function getCreatedDateInputGroupItems(components, createdDateErrors) {

  return components.map(component => {
    let classes = component.name === 'year' ? 'govuk-input--width-4' : 'govuk-input--width-2'
    const inputError = createdDateErrors.filter(item => item.field.includes('-' + component.name) || item.field === 'createdDate')
    if (inputError.length) {
      classes += ' govuk-input--error'
    }
    return { name: component.name, classes: classes, value: component.value }
  })
}

function createdDateValidator(value, helpers) {
  const {
    "createdDate-day": day,
    "createdDate-month": month,
    "createdDate-year": year,
    isExactDateUnknown } = value

  if (!isExactDateUnknown) {
    const dateValidatorResponse = dateValidator(day, month, year, false, 'createdDate', helpers)
    if (dateValidatorResponse) {
      return dateValidatorResponse
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
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }
      
      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
        createdDateDay: species.createdDate?.day,
        createdDateMonth: species.createdDate?.month,
        createdDateYear: species.createdDate?.year,
        isExactDateUnknown: species.createdDate?.isExactDateUnknown,
        approximateDate: species.createdDate?.approximateDate
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
          isExactDateUnknown: Joi.boolean().default(false),//.allow(null),
          approximateDate: Joi.when("isExactDateUnknown", {
            is: true,
            then: Joi.string().required()
          }),
          "createdDate-day": Joi.any().optional(),
          "createdDate-month": Joi.any().optional(),
          "createdDate-year": Joi.any().optional(),
        }).custom(createdDateValidator),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)

          const { "createdDate-day": day, "createdDate-month": month, "createdDate-year": year, isExactDateUnknown, approximateDate } = request.payload

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            speciesName: submission.applications[applicationIndex].species.speciesName,
            createdDateDay: day,
            createdDateMonth: month,
            createdDateYear: year,
            isExactDateUnknown: isExactDateUnknown,
            approximateDate: approximateDate
          }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        const { "createdDate-day": day, "createdDate-month": month, "createdDate-year": year, isExactDateUnknown, approximateDate } = request.payload
        species.createdDate = isExactDateUnknown
          ? { day: null, month: null, year: null, isExactDateUnknown: isExactDateUnknown, approximateDate: approximateDate }
          : { day: parseInt(day), month: parseInt(month), year: parseInt(year), isExactDateUnknown: isExactDateUnknown, approximateDate: null }

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }
        
        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          return h.redirect(exitChangeRouteUrl)
        }

        return h.redirect(`${nextPath}/${applicationIndex}`
        )
      }
    }
  }
]

