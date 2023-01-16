const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
const { ALPHA_REGEX, COMMENTS_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "source-code"
const currentPath = `${urlPrefix}/${pageId}`
const nextPath = `${urlPrefix}/purpose-code`
const invalidAppDataPath = urlPrefix

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
    backLink: `${urlPrefix}/species-name/${data.speciesIndex}`,
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
          text: pageContent.pageHeader,
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
        {
          value: "D",
          text: pageContent.radioOptionD,
          hint: { text: pageContent.radioOptionDHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "D")
        },
        data.kingdom === "Animalia" && {
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
          checked: isChecked(data.sourceCode, "U"),
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

function failAction(request, h, err) {
  const appData = getAppData(request)
  const pageData = {
    speciesIndex: request.params.speciesIndex,
    specimenIndex: request.params.specimenIndex,
    speciesName: appData.species[request.params.speciesIndex]?.speciesName,
    quantity: appData.species[request.params.speciesIndex]?.quantity,
    unitOfMeasurement:
      appData.species[request.params.speciesIndex]?.unitOfMeasurement,
    kingdom: appData.species[request.params.speciesIndex]?.kingdom,
    ...request.payload
  }
  return h.view(pageId, createModel(err, pageData)).takeover()
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
        kingdom: appData.species[request.params.speciesIndex]?.kingdom,
        sourceCode:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.sourceCode,
        anotherSourceCodeForI:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.anotherSourceCodeForI,
        anotherSourceCodeForO:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.anotherSourceCodeForO,
        enterAReason:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.enterAReason
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
          sourceCode: Joi.string()
            .required()
            .valid("W", "R", "D", "C", "F", "I", "O", "X", "A", "U"),
          anotherSourceCodeForI: Joi.when("sourceCode", {
            is: "I",
            then: Joi.string().length(1).regex(ALPHA_REGEX).required()
          }),
          anotherSourceCodeForO: Joi.when("sourceCode", {
            is: "O",
            then: Joi.string().length(1).regex(ALPHA_REGEX).required()
          }),
          enterAReason: Joi.when("sourceCode", {
            is: "U",
            then: Joi.string().min(1).max(151).regex(COMMENTS_REGEX).required()
          })
        }),

        failAction: failAction
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        const animalSchema = Joi.string()
          .required()
          .valid("W", "R", "D", "C", "F", "I", "O", "X", "U")
        const plantSchema = Joi.string()
          .required()
          .valid("W", "D", "A", "I", "O", "X", "U")

        const payloadSchema = appData.species[request.params.speciesIndex].kingdom === "Animalia" ? animalSchema : plantSchema
       

        const result = payloadSchema.validate(request.payload.sourceCode, { abortEarly: false })


        if (result.error) {
          return failAction(request, h, result.error)
        }

        const enterAReason =
          request.payload.sourceCode === "U" ? request.payload.enterAReason : ""
        const anotherSourceCodeForI =
          request.payload.sourceCode === "I"
            ? request.payload.anotherSourceCodeForI.toUpperCase()
            : ""
        const anotherSourceCodeForO =
          request.payload.sourceCode === "O"
            ? request.payload.anotherSourceCodeForO.toUpperCase()
            : ""

        appData.species[request.params.speciesIndex].specimens[
          request.params.specimenIndex
        ].sourceCode = request.payload.sourceCode
        appData.species[request.params.speciesIndex].specimens[
          request.params.specimenIndex
        ].anotherSourceCodeForI = anotherSourceCodeForI
        appData.species[request.params.speciesIndex].specimens[
          request.params.specimenIndex
        ].anotherSourceCodeForO = anotherSourceCodeForO
        appData.species[request.params.speciesIndex].specimens[
          request.params.specimenIndex
        ].enterAReason = enterAReason

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
