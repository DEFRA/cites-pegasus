const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
const { ALPHA_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "trade-term-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/specimen-type`
const nextPath = `${urlPrefix}/unique-identification-mark` //TO DO
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.tradeTermCode
  
  let isTradeTermCodeRadioVal = null
  switch (data.isTradeTermCode) {
    case true:
      isTradeTermCodeRadioVal = commonContent.radioOptionYes
      break;
    case false:
      isTradeTermCodeRadioVal = commonContent.radioOptionNo
      break;
  }


  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["isTradeTermCode", "tradeTermCode"]
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

  const tradeTermCodeInput = nunjucks.renderString(renderString, {
    input: {
      id: "tradeTermCode",
      name: "tradeTermCode",
      classes: "govuk-input govuk-input--width-2",
      label: {
        text: pageContent.inputLabelTradeCode
      },
      hint: {
        text: pageContent.inputLabelTradeCodeHint
      },
      ...(data.tradeTermCode ? { value: data.tradeTermCode } : {}),
      errorMessage: getFieldError(errorList, "#tradeTermCode")
    }
  })

  const model = {
    backLink: `${previousPath}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: captionText,

    inputIsTradeTermCode: {
      idPrefix: "isTradeTermCode",
      name: "isTradeTermCode",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "Yes",
          text: commonContent.radioOptionYes,
          checked: isChecked(isTradeTermCodeRadioVal, "Yes"),
          conditional: {
            html: tradeTermCodeInput
          }
        },
        {
          value: "No",
          text: commonContent.radioOptionNo,
          checked: isChecked(isTradeTermCodeRadioVal, "No")
        }
      ],

      errorMessage: getFieldError(errorList, "#isTradeTermCode")
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
        isTradeTermCode:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ].isTradeTermCode,
        tradeTermCode:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ].tradeTermCode
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
          isTradeTermCode: Joi.string().required().valid(textContent.common.radioOptionYes, textContent.common.radioOptionNo),
          tradeTermCode: Joi.when("isTradeTermCode", {
            is: "Yes",
            then: Joi.string().length(3).regex(ALPHA_REGEX).required()
          })
        }),

        failAction: (request, h, err) => {
          const appData = getAppData(request)
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
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const appData = getAppData(request)
        const isTradeTermCode = request.payload.isTradeTermCode === textContent.common.radioOptionYes;

        const tradeTermCode = request.payload.isTradeTermCode
          ? request.payload.tradeTermCode.toUpperCase()
          : ""

        appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex].isTradeTermCode = isTradeTermCode

        appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex].tradeTermCode = tradeTermCode

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
