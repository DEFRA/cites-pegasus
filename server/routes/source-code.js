const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, setAppData, validateAppData } = require("../lib/app-data")
const textContent = require("../content/text-content")
// const input = require("../views/input.html")
const pageId = "source-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`
const nextPath = `${urlPrefix}/purpose-code`

function createModel(errors, data) {
  const commonContent = textContent.common

  const pageContent =
    data.kingdom === "Animalia"
      ? textContent.sourceCode.animal
      : textContent.sourceCode.plant

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["sourceCode"]
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

  const model = {
    backLink: previousPath,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: captionText,

    //Text Input part
    inputLabelIEnterAnotherSourceCode: {
      id: "enterAnotherSourceCode",
      name: "enterAnotherSourceCode",
      classes: "govuk-input govuk-input--width-2",
      label: {
        text: pageContent.inputLabelIEnterAnotherSourceCode
      },
      ...(data.anotherSourceCode ? { value: data.anotherSourceCode } : {}),
      errorMessage: getFieldError(errorList, "#anotherSourceCode")
    },

     //Radio part
    inputSourceCode: {
      idPrefix: "sourceCode",
      name: "sourceCode",
      fieldset: {
        legend: {
          text: pageContent.heading,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "W",
          text: pageContent.radioOptionW,
          hint: { text: pageContent.radioOptionWHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "W")
        },
        data.kingdom === "Animalia" && {
          value: "R",
          text: pageContent.radioOptionR,
          hint: { text: pageContent.radioOptionRHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "R")
        },
        data.kingdom === "Animalia" && {
          value: "D",
          text: pageContent.radioOptionD,
          hint: { text: pageContent.radioOptionDHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "D")
        },
        {
          value: "C",
          text: pageContent.radioOptionC,
          hint: { text: pageContent.radioOptionCHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "C")
        },
        data.kingdom === "Animalia" && {
          value: "F",
          text: pageContent.radioOptionF,
          hint: { text: pageContent.radioOptionFHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "F")
        },
        !(data.kingdom === "Animalia") && {
          value: "A",
          text: pageContent.radioOptionA,
          hint: { text: pageContent.radioOptionAHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "A")
        },
        {
          value: "I",
          text: pageContent.radioOptionI,
          hint: { text: pageContent.radioOptionIHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "I"),

          //condional text input
          conditional: {
            html: data.speciesName
            // html: govukInput({
            //   id: "enterAnotherSourceCode",
            //   name: "enterAnotherSourceCode",
            //   classes: "govuk-input govuk-input--width-2",
            //   label: {
            //     text: pageContent.inputLabelIEnterAnotherSourceCode
            //   },
            //   ...(data.anotherSourceCode
            //     ? { value: data.anotherSourceCode }
            //     : {}),
            //   errorMessage: getFieldError(errorList, "#anotherSourceCode")
            // })          
          }
        },
        {
          value: "O",
          text: pageContent.radioOptionO,
          hint: { text: pageContent.radioOptionOHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "O")
          
        },
        {
          value: "X",
          text: pageContent.radioOptionX,
          hint: { text: pageContent.radioOptionXHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "X")
        },
        {
          divider: pageContent.dividerText
        },
        {
          value: "U",
          text: pageContent.radioOptionU,
          hint: {
            text: pageContent.radioOptionUHint,
            classes: "govuk-!-font-weight-bold"
          },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "C")
        }
      ],
      errorMessage: getFieldError(errorList, "#sourceCode")
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
      // validateAppData(appData, `${pageId}/${request.params.speciesType}`)

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        speciesName: appData?.speciesName,
        quantity: appData?.quantity,
        unitOfMeasurement: appData?.unitOfMeasurement,
        kingdom: appData?.kingdom,
        sourceCode: appData?.sourceCode,
        anotherSourceCode: appData?.anotherSourceCode,
        ...appData[request.params.speciesIndex],
        ...appData[request.params.specimenIndex]
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
          sourceCode: Joi.string().required(),
          anotherSourceCode: Joi.string().required()
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            speciesName: appData?.speciesName,
            quantity: appData?.quantity,
            unitOfMeasurement: appData?.unitOfMeasurement,
            kingdom: appData?.kingdom,
            ...appData[request.params.speciesIndex],
            ...appData[request.params.specimenIndex]
          }
          return h.view(pageId, createModel(pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        setAppData(request, {
          sourceCode: request.payload.sourceCode,
          anotherSourceCode: request.payload.anotherSourceCode
        })
        return h.redirect(
          `${nextPath}/${request.params.speciesIndex}/${request.params.specimenIndex}`
        )
      }
    }
  }
]
