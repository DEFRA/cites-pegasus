const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { dateValidator } = require("../lib/validators")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "acquired-date"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const nextPath = `${urlPrefix}/already-have-a10`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.acquiredDate

  let acquiredDateErrors = []
  let errorList = null

  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = [
      "acquiredDate",
      "acquiredDate-day",
      "acquiredDate-day-month",
      "acquiredDate-day-year",
      "acquiredDate-month",
      "acquiredDate-month-year",
      "acquiredDate-year",
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
    const acquiredDateFields = [
      "acquiredDate",
      "acquiredDate-day",
      "acquiredDate-day-month",
      "acquiredDate-day-year",
      "acquiredDate-month",
      "acquiredDate-month-year",
      "acquiredDate-year"
    ]
    acquiredDateFields.forEach((field) => {
      const error = getFieldError(errorList, "#" + field)
      if (error) {
        acquiredDateErrors.push({ field: field, message: error.text })
      }
    })
  }

  const acquiredDateErrorMessage = acquiredDateErrors.map(item => { return item.message }).join('</p> <p class="govuk-error-message">')

  const acquiredDateComponents = [
    { name: 'day', value: data.acquiredDateDay },
    { name: 'month', value: data.acquiredDateMonth },
    { name: 'year', value: data.acquiredDateYear }
  ]

  const renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"

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

  const previousPath = data.sex ? previousPathDescribeLivingAnimal : previousPathDescribeSpecimen

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    captionText: data.speciesName,

    inputAcquiredDate: {
      id: "acquiredDate",
      name: "acquiredDate",
      namePrefix: "acquiredDate",
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
      items: getAcquiredDateInputGroupItems(acquiredDateComponents, acquiredDateErrors),
      errorMessage: acquiredDateErrorMessage ? { html: acquiredDateErrorMessage } : null
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

function getAcquiredDateInputGroupItems(components, acquiredDateErrors) {

  return components.map(component => {
    let classes = component.name === 'year' ? 'govuk-input--width-4' : 'govuk-input--width-2'
    const inputError = acquiredDateErrors.filter(item => item.field.includes('-' + component.name) || item.field === 'acquiredDate')
    if (inputError.length) {
      classes += ' govuk-input--error'
    }
    return { name: component.name, classes: classes, value: component.value }
  })
}

function acquiredDateValidator(value, helpers) {
  const {
    "acquiredDate-day": day,
    "acquiredDate-month": month,
    "acquiredDate-year": year,
    isExactDateUnknown } = value

  if (!isExactDateUnknown) {
    const dateValidatorResponse = dateValidator(day, month, year, false, 'acquiredDate', helpers)
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
        sex: species.sex,
        acquiredDateDay: species.acquiredDate?.day,
        acquiredDateMonth: species.acquiredDate?.month,
        acquiredDateYear: species.acquiredDate?.year,
        isExactDateUnknown: species.acquiredDate?.isExactDateUnknown,
        approximateDate: species.acquiredDate?.approximateDate
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
            then: Joi.string().max(150).required()
          }),
          "acquiredDate-day": Joi.any().optional(),
          "acquiredDate-month": Joi.any().optional(),
          "acquiredDate-year": Joi.any().optional(),
        }).custom(acquiredDateValidator),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const species = submission.applications[applicationIndex].species

          const { "acquiredDate-day": day, "acquiredDate-month": month, "acquiredDate-year": year, isExactDateUnknown, approximateDate } = request.payload

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            speciesName: species.speciesName,
            sex: species.sex,
            acquiredDateDay: day,
            acquiredDateMonth: month,
            acquiredDateYear: year,
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

        const { "acquiredDate-day": day, "acquiredDate-month": month, "acquiredDate-year": year, isExactDateUnknown, approximateDate } = request.payload
        species.acquiredDate = isExactDateUnknown
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

        return h.redirect(
          `${nextPath}/${applicationIndex}`
        )
      }
    }
  }
]

