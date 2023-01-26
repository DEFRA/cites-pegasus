const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
const { isValidDate, isPastDate } = require("../lib/validators")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const value = require("../content/text-content")
const pageId = "created-date"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/specimen-type`
const nextPath = `${urlPrefix}/trade-term-code`
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.createdDate
  const speciesName = data.speciesName
  const quantity = data.quantity
  const specimenIndex = data.specimenIndex + 1
  const unitOfMeasurement = data.unitOfMeasurement

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
      "createdDate-month",
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
      "createdDate-month",
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

  const captionText =
    unitOfMeasurement === "noOfSpecimens"
      ? `${speciesName} (${specimenIndex} of ${quantity})`
      : `${speciesName}`

  var renderString =
    "{% from 'govuk/components/input/macro.njk' import govukInput %} \n"
  renderString = renderString + " {{govukInput(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const approximateDateInput = nunjucks.renderString(renderString, {
    input: {
      id: "approximateDate",
      name: "approximateDate",
      classes: "govuk-input govuk-!-width-two-thirds",
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



  const model = {
    backLink: `${previousPath}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    captionText: captionText,

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
    const inputError = createdDateErrors.filter(item => item.field === 'createdDate-' + component.name || item.field === 'createdDate')
    if (inputError.length) {
      classes += ' govuk-input--error'
    }
    return { name: component.name, classes: classes, value: component.value }
  })
}

function createdDateValidator(value, helpers){
  const {
    "createdDate-day": day,
    "createdDate-month": month,
    "createdDate-year": year,
    isExactDateUnknown } = value

  if (!isExactDateUnknown) {

    if (!day && !month && !year) {
      return helpers.error('any.empty', { customLabel: 'createdDate' });
    }

    if (!day) {
      return helpers.error('any.empty', { customLabel: 'createdDate-day' });
    }

    if (!month) {
      return helpers.error('any.empty', { customLabel: 'createdDate-month' });
    }

    if (!year) {
      return helpers.error('any.empty', { customLabel: 'createdDate-year' });
    }

    if (!isValidDate(day, month, year)) {
      return helpers.error('any.invalid', { customLabel: 'createdDate' });
    } else {
      const date = new Date(year, month - 1, day);
      if (!isPastDate(date, true)) {
        return helpers.error('any.future', { customLabel: 'createdDate' });
      }
    }
  }
  return value
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{speciesIndex}/{specimenIndex}`,
    options: {
      validate: {
        params: Joi.object({
          speciesIndex: Joi.number().required(),
          specimenIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const appData = getAppData(request)

      try {
        validateAppData(
          appData,
          `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
        )
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const specimen = appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex]

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        speciesName: appData.species[request.params.speciesIndex]?.speciesName,
        quantity: appData.species[request.params.speciesIndex]?.quantity,
        unitOfMeasurement:
          appData.species[request.params.speciesIndex]?.unitOfMeasurement,
        createdDateDay: specimen.createdDate?.day,
        createdDateMonth: specimen.createdDate?.month,
        createdDateYear: specimen.createdDate?.year,
        isExactDateUnknown: specimen.createdDate?.isExactDateUnknown,
        approximateDate: specimen.createdDate?.approximateDate
      }
      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{speciesIndex}/{specimenIndex}`,
    options: {
      validate: {
        params: Joi.object({
          speciesIndex: Joi.number().required(),
          specimenIndex: Joi.number().required()
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
          const appData = getAppData(request)

          const { "createdDate-day": day, "createdDate-month": month, "createdDate-year": year, isExactDateUnknown, approximateDate } = request.payload


          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            speciesName: appData.species[request.params.speciesIndex]?.speciesName,
            quantity: appData.species[request.params.speciesIndex]?.quantity,
            unitOfMeasurement: appData.species[request.params.speciesIndex]?.unitOfMeasurement,
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
        const appData = getAppData(request)

        const specimen = appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex]
        const { "createdDate-day": day, "createdDate-month": month, "createdDate-year": year, isExactDateUnknown, approximateDate } = request.payload
        specimen.createdDate = isExactDateUnknown
              ? { day: null, month: null, year: null, isExactDateUnknown: isExactDateUnknown, approximateDate: approximateDate } 
              : { day: parseInt(day), month: parseInt(month), year: parseInt(year), isExactDateUnknown: isExactDateUnknown, approximateDate: null }
        
        try {
          mergeAppData(
            request,
            { species: appData.species },
            `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }

        return h.redirect(
          `${nextPath}/${request.params.speciesIndex}/${request.params.specimenIndex}`
        )
      }
    }
  }
]

