const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked,
  isAnimal
} = require("../lib/helper-functions")
const { getAppData, setAppData, validateAppData } = require("../lib/app-data")
const textContent = require("../content/text-content")
const pageId = "source-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`
const nextPath = `${urlPrefix}/PURPOSE-NOT-DONE-YET` //TODO
const speciesTypes = ["animal", "plant"]

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = null

  if (isAnimal(data.speciesType)) {
    pageContent = textContent.sourceCode.animal
  } else {
    pageContent = textContent.sourceCode.plant
  }

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
  const specimenIndex = data.specimenIndex
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

    inputSource: {
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
          checked: isChecked(data.sourceCode, "W")
        },
        isAnimal(data.speciesType) && {
          value: "R",
          text: pageContent.radioOptionR,
          hint: { text: pageContent.radioOptionRHint },
          checked: isChecked(data.sourceCode, "R")
        },
        isAnimal(data.speciesType) && {
          value: "D",
          text: pageContent.radioOptionD,
          hint: { text: pageContent.radioOptionDHint },
          checked: isChecked(data.sourceCode, "D")
        },
        {
          value: "C",
          text: pageContent.radioOptionC,
          hint: { text: pageContent.radioOptionCHint },
          checked: isChecked(data.sourceCode, "C")
        },
        isAnimal(data.speciesType) && {
          value: "F",
          text: pageContent.radioOptionF,
          hint: { text: pageContent.radioOptionFHint },
          checked: isChecked(data.sourceCode, "F")
        },
        !isAnimal(data.speciesType) && {
          value: "A",
          text: pageContent.radioOptionA,
          hint: { text: pageContent.radioOptionAHint },
          checked: isChecked(data.sourceCode, "A")
        },
        {
          value: "I",
          text: pageContent.radioOptionI,
          hint: { text: pageContent.radioOptionIHint },
          checked: isChecked(data.sourceCode, "I")
          // conditional: {
          //     html: emailHtml
          //   },
        },
        {
          value: "O",
          text: pageContent.radioOptionO,
          hint: { text: pageContent.radioOptionOHint },
          checked: isChecked(data.sourceCode, "O")
          // conditional: {
          //     html: emailHtml
          //   },
        },
        {
          value: "X",
          text: pageContent.radioOptionX,
          hint: { text: pageContent.radioOptionXHint },
          checked: isChecked(data.sourceCode, "X")
        },
        {
          divider: pageContent.dividerText
        },
        {
          value: "U",
          text: pageContent.radioOptionDontKnow,
          hint: { text: pageContent.radioOptionDontKnowHint },
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
        speciesType: appData?.kingdom,
        sourceCode: appData?.sourceCode,
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
          sourceCode: Joi.string().required()
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            speciesType: request.params.speciesType,
            isAgent: appData?.isAgent,
            ...request.payload
          }

          return h.view(pageId, createModel(pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        setAppData(request, { source: request.payload.source })
        return h.redirect(nextPath)
      }
    }
  }
]
