const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked,
  isAnimal
} = require("../helpers/helper-functions")
const {
  getAppData,
  setAppData,
  validateAppData
} = require("../helpers/app-data")
const textContent = require("../content/text-content")
const pageId = "source"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`
const nextPath = `${urlPrefix}/PURPOSE-NOT-DONE-YET` //TODO
const speciesTypes = ["animal", "plant"]

function createModel(errors, source) {
  const commonContent = textContent.common
  const pageContent = null

  if (isAnimal(data.speciesType)) {
    pageContent = textContent.source.animal
  } else {
    pageContent = textContent.source.plant
  }

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["source"]
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

  const model = {
    backLink: previousPath,
    formActionPage: currentPath,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    inputSource: {
      idPrefix: "source",
      name: "source",
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
          checked: isChecked(source, "W")
        },
        isAnimal(data.speciesType) && {
          value: "R",
          text: pageContent.radioOptionR,
          hint: { text: pageContent.radioOptionRHint },
          checked: isChecked(source, "R")
        },
        isAnimal(data.speciesType) && {
          value: "D",
          text: pageContent.radioOptionD,
          hint: { text: pageContent.radioOptionDHint },
          checked: isChecked(source, "D")
        },
        {
          value: "C",
          text: pageContent.radioOptionC,
          hint: { text: pageContent.radioOptionCHint },
          checked: isChecked(source, "C")
        },
        isAnimal(data.speciesType) && {
          value: "F",
          text: pageContent.radioOptionF,
          hint: { text: pageContent.radioOptionFHint },
          checked: isChecked(source, "F")
        },
        !isAnimal(data.speciesType) && {
          value: "A",
          text: pageContent.radioOptionA,
          hint: { text: pageContent.radioOptionAHint },
          checked: isChecked(source, "A")
        },
        {
          value: "I",
          text: pageContent.radioOptionI,
          hint: { text: pageContent.radioOptionIHint },
          checked: isChecked(source, "I")
          // conditional: {
          //     html: emailHtml
          //   },
        },
        {
          value: "O",
          text: pageContent.radioOptionO,
          hint: { text: pageContent.radioOptionOHint },
          checked: isChecked(source, "O")
          // conditional: {
          //     html: emailHtml
          //   },
        },
        {
          value: "X",
          text: pageContent.radioOptionX,
          hint: { text: pageContent.radioOptionXHint },
          checked: isChecked(source, "X")
        },
        {
          divider: pageContent.dividerText
        },
        {
          value: "U",
          text: pageContent.radioOptionDontKnow,
          hint: { text: pageContent.radioOptionDontKnowHint },
          checked: isChecked(source, "C")
        }
      ],
      errorMessage: getFieldError(errorList, "#source")
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{speciesType}`,
    options: {
        validate: {
            params: Joi.object({
                speciesType: Joi.string().valid(...speciesTypes)
            }),
            failAction: (request, h, error) => {
                console.log(error)
            }
        }
    },
    handler: async (request, h) => {
      const appData = getAppData(request)
      validateAppData(appData, `${pageId}/${request.params.speciesType}`)

      const pageData = { speciesType: request.params.speciesType, source: appData?.source }
      return h.view(pageId, createModel(null, pageData));
    //   return h.view(pageId, createModel(null, appData?.source))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{speciesType}`,
    options: {
      validate: {
        params: Joi.object({
            speciesType: Joi.string().valid(...speciesTypes)
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          source: Joi.string().required()
        }),
        failAction: (request, h, err) => {
            const appData = getAppData(request);
                const pageData = { 
                    speciesType: request.params.speciesType, 
                    isAgent: appData?.isAgent, 
                    ...request.payload 
                }

          return h
            .view(pageId, createModel(pageData))
            .takeover()
        }
      },
      handler: async (request, h) => {
        setAppData(request, { source: request.payload.source })
        return h.redirect(nextPath)
      }
    }
  }
]
