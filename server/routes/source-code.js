const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
const { ALPHA_REGEX, COMMENTS_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "source-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`
const nextPath = `${urlPrefix}/purpose-code`
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const isAnimal = data.kingdom === "Animalia"

  const pageContent = isAnimal ? textContent.sourceCode.animal : textContent.sourceCode.plant

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
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

  var renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n"
  renderString = renderString + " {{govukInput(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

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

  var renderString = "{% from 'govuk/components/character-count/macro.njk' import govukCharacterCount %} \n"
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
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: data.speciesName,

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
        isAnimal && {
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
        isAnimal && {
          value: "C",
          text: pageContent.radioOptionC,
          hint: { text: pageContent.radioOptionCHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "C")
        },
        isAnimal && {
          value: "F",
          text: pageContent.radioOptionF,
          hint: { text: pageContent.radioOptionFHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "F")
        },
        !(isAnimal) && {
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
  const species = appData.applications[request.params.applicationIndex].species
  const pageData = {
    applicationIndex: request.params.applicationIndex,
    speciesName: species.speciesName,
    kingdom: species.kingdom,
    ...request.payload
  }
  return h.view(pageId, createModel(err, pageData)).takeover()
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
      const {applicationIndex} = request.params
      const appData = getAppData(request)

      try {
        validateAppData(appData, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const species = appData.applications[applicationIndex].species

      const pageData = {
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
        kingdom: species.kingdom,
        sourceCode: species.sourceCode,
        anotherSourceCodeForI: species.anotherSourceCodeForI,
        anotherSourceCodeForO: species.anotherSourceCodeForO,
        enterAReason: species.enterAReason
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
        const { applicationIndex } = request.params
        const appData = getAppData(request)
        const species = appData.applications[applicationIndex].species

        const animalSchema = Joi.string()
          .required()
          .valid("W", "R", "D", "C", "F", "I", "O", "X", "U")
        const plantSchema = Joi.string()
          .required()
          .valid("W", "D", "A", "I", "O", "X", "U")

        const payloadSchema = species.kingdom === "Animalia" ? animalSchema : plantSchema

        const result = payloadSchema.validate(request.payload.sourceCode, { abortEarly: false })


        if (result.error) {
          return failAction(request, h, result.error)
        }

        species.sourceCode = request.payload.sourceCode
        species.anotherSourceCodeForI = request.payload.sourceCode === "I" ? request.payload.anotherSourceCodeForI.toUpperCase() : ""
        species.anotherSourceCodeForO = request.payload.sourceCode === "O" ? request.payload.anotherSourceCodeForO.toUpperCase() : ""
        species.enterAReason = request.payload.sourceCode === "U" ? request.payload.enterAReason : ""


        try {
          mergeAppData(request, { applications: appData.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }

        return h.redirect(`${nextPath}/${applicationIndex}`)
      }
    }
  }
]
