const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { ALPHA_REGEX, COMMENTS_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const lodash = require("lodash")
const nunjucks = require("nunjucks")
const { checkChangeRouteExit } = require("../lib/change-route")
const pageId = "source-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`
const nextPathPurposeCode = `${urlPrefix}/purpose-code`
const nextPathUseCertFor = `${urlPrefix}/use-certificate-for`
const invalidSubmissionPath = `${urlPrefix}/`

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
      "secondSourceCodeForI",
      "secondSourceCodeForO",
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


  const secondSourceCodeI = lodash.cloneDeep([
    { text: pageContent.secondSourceCodePrompt, value: null },
    ...pageContent.secondSourceCodes
  ])

  secondSourceCodeI.forEach((e) => {
    if (e.value === data.secondSourceCodeForI) e.selected = "true"
  })

  const secondSourceCodeO = lodash.cloneDeep([
    { text: pageContent.secondSourceCodePrompt, value: null },
    ...pageContent.secondSourceCodes
  ])
 
 secondSourceCodeO.forEach((e) => {
    if (e.value === data.secondSourceCodeForO) e.selected = "true"
  })

  var renderString = "{% from 'govuk/components/select/macro.njk' import govukSelect %} \n {{govukSelect(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const sourceInputForI = nunjucks.renderString(renderString, {
    input: {
      id: "secondSourceCodeForI",
      name: "secondSourceCodeForI",
      items: secondSourceCodeI,
      errorMessage: getFieldError(errorList, "#secondSourceCodeForI")
    }
  })

  const sourceInputForO = nunjucks.renderString(renderString, {
    input: {
      id: "secondSourceCodeForO",
      name: "secondSourceCodeForO",
      items: secondSourceCodeO,
      errorMessage: getFieldError(errorList, "#secondSourceCodeForO")
    }
  })

  var renderString = "{% from 'govuk/components/character-count/macro.njk' import govukCharacterCount %} \n {{govukCharacterCount(input)}}"

  const sourceCharacterCount =  nunjucks.renderString(renderString, {
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

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
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
          hint: { html: pageContent.radioOptionCHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "C")
        },
        isAnimal && {
          value: "F",
          text: pageContent.radioOptionF,
          hint: { html: pageContent.radioOptionFHint },
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
        !(isAnimal) && {
          value: "Y",
          text: pageContent.radioOptionY,
          hint: { html: pageContent.radioOptionYHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.sourceCode, "Y")
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
  const submission = getSubmission(request)
  const species = submission.applications[request.params.applicationIndex].species
  const pageData = {
    backLinkOverride: checkChangeRouteExit(request, true),
    applicationIndex: request.params.applicationIndex,
    speciesName: species.speciesName,
    kingdom: species.kingdom,
    ...request.payload
  }
  return h.view(pageId, createModel(err, pageData)).takeover()
}

const secondSourceCodesPlantValues = textContent.sourceCode.plant.secondSourceCodes.map(
  (e) => e.value
)

const secondSourceCodesAnimalValues = textContent.sourceCode.animal.secondSourceCodes.map(
  (e) => e.value
)


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
        console.log(err)
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
        kingdom: species.kingdom,
        sourceCode: species.sourceCode,
        secondSourceCodeForI: species.secondSourceCodeForI,
        secondSourceCodeForO: species.secondSourceCodeForO,
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
          sourceCode: Joi.string().required().valid("W", "R", "D", "C", "F", "I", "O", "X", "A", "U", "Y"),
          secondSourceCodeForI: Joi.when("sourceCode", {
            is: "I",
            then: Joi.string().valid(...secondSourceCodesAnimalValues, ...secondSourceCodesPlantValues).required()
          }),
          secondSourceCodeForO: Joi.when("sourceCode", {
            is: "O",
            then: Joi.string().valid(...secondSourceCodesAnimalValues, ...secondSourceCodesPlantValues).required()
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
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        const animalSchema = Joi.string().required().valid("W", "R", "D", "C", "F", "I", "O", "X", "U")
        const plantSchema = Joi.string().required().valid("W", "D", "A", "I", "O", "X", "U", "Y")

        const payloadSchema = species.kingdom === "Animalia" ? animalSchema : plantSchema

        const result = payloadSchema.validate(request.payload.sourceCode, { abortEarly: false })


        if (result.error) {
          return failAction(request, h, result.error)
        }

        species.sourceCode = request.payload.sourceCode
        species.secondSourceCodeForI = request.payload.sourceCode === "I" ? request.payload.secondSourceCodeForI.toUpperCase() : ""
        species.secondSourceCodeForO = request.payload.sourceCode === "O" ? request.payload.secondSourceCodeForO.toUpperCase() : ""
        species.enterAReason = request.payload.sourceCode === "U" ? request.payload.enterAReason : ""


        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.log(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          return h.redirect(exitChangeRouteUrl)
        }

        if (submission.permitType === 'article10') {
          return h.redirect(`${nextPathUseCertFor}/${applicationIndex}`)
        } else {
          return h.redirect(`${nextPathPurposeCode}/${applicationIndex}`)
        }

      }
    }
  }
]
