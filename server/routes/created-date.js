const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
// const { DATE_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "created-date"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/specimen-type`
const nextPath = `${urlPrefix}/trade-term-code`
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.createdDate

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = [
      "createdDate",
      "isExactDateUnknown",
      "enterAnApproximateDate"
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

  const speciesName = data.speciesName
  const quantity = data.quantity
  const specimenIndex = data.specimenIndex + 1
  const unitOfMeasurement = data.unitOfMeasurement

  const captionText =
    unitOfMeasurement === "noOfSpecimens"
      ? `${speciesName} (${specimenIndex} of ${quantity})`
      : `${speciesName}`

  var renderString =
    "{% from 'govuk/components/input/macro.njk' import govukInput %} \n"
  renderString = renderString + " {{govukInput(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const enterAnApproximateDateInput = nunjucks.renderString(renderString, {
    input: {
      id: "enterAnApproximateDate",
      name: "enterAnApproximateDate",
      classes: "govuk-input govuk-!-width-two-thirds",
      label: {
        text: pageContent.inputLabelEnterAnApproximateDate
      },
      hint: {
        text: pageContent.inputLabelHintEnterAnApproximateDate
      },
      ...(data.enterAnApproximateDate
        ? { value: data.enterAnApproximateDate }
        : {}),
      errorMessage: getFieldError(errorList, "#enterAnApproximateDate")
    }
  })

  const model = {
    backLink: previousPath,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: captionText,

    inputCreatedDate: {
      idPrefix: "createdDate",
      name: "createdDate",
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
      items: [
        {
          name: "day",
          classes: "govuk-input--width-2",
        },
        {
          name: "month",
          classes: "govuk-input--width-2",
        },
        {
          name: "year",
          classes: "govuk-input--width-4",
        }
      ],
      ...(data.createdDate ? { value: data.createdDate } : {}),
      errorMessage: getFieldError(errorList, "#createdDate")
    },

    checkboxIsExactDateUnknown: {
      idPrefix: "isExactDateUnknown",
      name: "isExactDateUnknown",
      classes: "govuk-checkboxes--small",
      items: [
        {
          value: "isExactDateUnknown",
          text: pageContent.checkboxLabelIsExactDateUnknown,
          conditional: {
            html: enterAnApproximateDateInput
          }
        }
      ],
      errorMessage: getFieldError(errorList, "#isExactDateUnknown")
    }
  }
  return { ...commonContent, ...model }
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

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        speciesName: appData.species[request.params.speciesIndex]?.speciesName,
        quantity: appData.species[request.params.speciesIndex]?.quantity,
        unitOfMeasurement:
          appData.species[request.params.speciesIndex]?.unitOfMeasurement,
        createdDate:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ].createdDate,
        isExactDateUnknown:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ].isExactDateUnknown,
        enterAnApproximateDate:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ].enterAnApproximateDate
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
          createdDate: Joi.date().max("now").required(),
          isExactDateUnknown: Joi.string().required(),
          enterAnApproximateDate: Joi.when("isExactDateUnknown", {
            is: true,
            then: Joi.string().required()
          })
        }),

        failAction: (request, h, err) => {
          const appData = getAppData(request)

          console.log("APPDATA>>>>", appData)

          const payload = request.payload


          console.log("payload>>>>", payload)


          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            speciesName:
              appData.species[request.params.speciesIndex]?.speciesName,
            quantity: appData.species[request.params.speciesIndex]?.quantity,
            unitOfMeasurement:
              appData.species[request.params.speciesIndex]?.unitOfMeasurement,
            ...request.payload
          }

          console.log("PAGEDATA>>>", pageData)


          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        const specimen = appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex]

        specimen.createdDate = request.payload.createdDate

        specimen.isExactDateUnknown = request.payload.isExactDateUnknown

        specimen.enterAnApproximateDate = request.payload.isExactDateUnknown ? request.payload.enterAnApproximateDate : ""

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


// ...(data.createdDay ? { value: data.createdDay } : {}),
// ...(data.createdMonth ? { value: data.createdMonth } : {}),
// ...(data.createdYear ? { value: data.createdYear } : {}),
// createdDay: Joi.number().required(),
//           createdMonth: Joi.number().required(),
//           createdYear: Joi.number().required(),