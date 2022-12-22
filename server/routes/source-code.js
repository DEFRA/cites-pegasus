const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, setAppData, validateAppData } = require("../lib/app-data")
const { SOURCECODE_REGEX, COMMENTS_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "source-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`
const nextPath = `${urlPrefix}/purpose-code`

function createModel(errors, data) {
  const commonContent = textContent.common

  console.log("DATA>>>>", data)

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
    const fields = [
      "sourceCode",
      "anotherSourceCodeForI",
      "anotherSourceCodeForO",
      "enterAReason"
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

  const sourceInputForI = nunjucks.renderString(renderString, {
    input: {
      id: "anotherSourceCodeForI",
      name: "anotherSourceCodeForI",
      classes: "govuk-input govuk-input--width-2",
      label: {
        text: pageContent.inputLabelEnterAnotherSourceCode
      },
      ...(data.anotherSourceCodeForI
        ? { value: data.anotherSourceCodeForI }
        : {}),
      errorMessage: getFieldError(errorList, "#anotherSourceCodeForI")
    }
  })

  const sourceInputForO = nunjucks.renderString(renderString, {
    input: {
      id: "anotherSourceCodeForO",
      name: "anotherSourceCodeForO",
      classes: "govuk-input govuk-input--width-2",
      label: {
        text: pageContent.inputLabelEnterAnotherSourceCode
      },
      ...(data.anotherSourceCodeForO
        ? { value: data.anotherSourceCodeForO }
        : {}),
      errorMessage: getFieldError(errorList, "#anotherSourceCodeForO")
    }
  })

  var renderString =
    "{% from 'govuk/components/character-count/macro.njk' import govukCharacterCount %} \n"
  renderString = renderString + " {{govukCharacterCount(input)}}"

  const sourceCharacterCount = nunjucks.renderString(renderString, {
    input: {
      id: "enterAReason",
      name: "enterAReason",
      maxlength: 150,
      classes: "govuk-textarea govuk-js-character-count",
      label: {
        text: pageContent.characterCountLabelEnterAReason
      },
      ...(data.enterAReason ? { value: data.enterAReason } : {}),
      errorMessage: getFieldError(errorList, "#enterAReason")
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
          conditional: {
            html: sourceInputForI
          }
        },
        {
          value: "O",
          text: pageContent.radioOptionO,
          hint: { text: pageContent.radioOptionOHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "O"),
          conditional: {
            html: sourceInputForO
          }
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
          checked: isChecked(data.sourceCode, "C"),
          conditional: {
            html: sourceCharacterCount
          }
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
        speciesName: appData.species[request.params.speciesIndex]?.speciesName,
        quantity: appData.species[request.params.speciesIndex]?.quantity,
        unitOfMeasurement:
          appData.species[request.params.speciesIndex]?.unitOfMeasurement,
        kingdom: appData.species[request.params.speciesIndex]?.kingdom,
        sourceCode:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.sourceCode,
        anotherSourceCodeForI:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.sourceCode,
        anotherSourceCodeForO:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.sourceCode,
        enterAReason:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.enterAReason,
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
          anotherSourceCodeForI: Joi.when("sourceCode", {
            is: "I",
            then: Joi.string().length(1).regex(SOURCECODE_REGEX).required()
          }),
          anotherSourceCodeForO: Joi.when("sourceCode", {
            is: "O",
            then: Joi.string().length(1).regex(SOURCECODE_REGEX).required()
          }),
          enterAReason: Joi.when("sourceCode", {
            is: "U",
            then: Joi.string().min(1).max(151).regex(COMMENTS_REGEX).required()
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
            kingdom: appData.species[request.params.speciesIndex]?.kingdom,
            ...appData[request.params.speciesIndex],
            ...appData[request.params.specimenIndex]
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const specimensData = getAppData(request)
        const specimenData =
          specimensData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]
        let sourceCode = ""
        switch (request.payload.sourceCode) {
          case "I":
            sourceCode = request.payload.anotherSourceCodeForI
            break
          case "O":
            sourceCode = request.payload.anotherSourceCodeForO
            break
          default:
            sourceCode = request.payload.sourceCode
        }

        let enterAReason =
          request.payload.sourceCode === "U" ? request.payload.enterAReason : ""

        // enterAReason = specimenData.push({ enterAReason: enterAReason })
        // sourceCode = specimenData.push({ sourceCode: sourceCode })

        const appData = {
          sourceCode: sourceCode,
          enterAReason: enterAReason
        }

        // const appData = {
        //   [species]: {
        //     sourceCode: sourceCode,
        //     enterAReason: enterAReason
        //   }
        // }

        const newAppData = specimenData.push(appData)

        setAppData(request, newAppData)
        return h.redirect(
          `${nextPath}/${request.params.speciesIndex}/${request.params.specimenIndex}`
        )
      }
    }
  }
]
