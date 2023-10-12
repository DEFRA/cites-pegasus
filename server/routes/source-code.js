const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const config = require('../../config/config')
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const lodash = require("lodash")
const nunjucks = require("nunjucks")
const { checkChangeRouteExit } = require("../lib/change-route")
const pageId = "source-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathSpeciesName = `${urlPrefix}/species-name`
const previousPathSpeciesWarning = `${urlPrefix}/species-warning`
const nextPathPurposeCode = `${urlPrefix}/purpose-code`
const nextPathSpecimenOrigin = `${urlPrefix}/specimen-origin`
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


  const anotherSourceCodeI = lodash.cloneDeep([
    { text: pageContent.anotherSourceCodePrompt, value: null },
    ...pageContent.anotherSourceCodes
  ])

  anotherSourceCodeI.forEach((e) => {
    if (e.value === data.anotherSourceCodeForI) e.selected = "true"
  })

  const anotherSourceCodeO = lodash.cloneDeep([
    { text: pageContent.anotherSourceCodePrompt, value: null },
    ...pageContent.anotherSourceCodes
  ])
 
 anotherSourceCodeO.forEach((e) => {
    if (e.value === data.anotherSourceCodeForO) e.selected = "true"
  })

  let renderString = "{% from 'govuk/components/select/macro.njk' import govukSelect %} \n {{govukSelect(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const sourceInputForI = nunjucks.renderString(renderString, {
    input: {
      id: "anotherSourceCodeForI",
      name: "anotherSourceCodeForI",
      items: anotherSourceCodeI,
      errorMessage: getFieldError(errorList, "#anotherSourceCodeForI")
    }
  })

  const sourceInputForO = nunjucks.renderString(renderString, {
    input: {
      id: "anotherSourceCodeForO",
      name: "anotherSourceCodeForO",
      items: anotherSourceCodeO,
      errorMessage: getFieldError(errorList, "#anotherSourceCodeForO")
    }
  })

  renderString = "{% from 'govuk/components/character-count/macro.njk' import govukCharacterCount %} \n {{govukCharacterCount(input)}}"

  const sourceCharacterCount =  nunjucks.renderString(renderString, {
    input: {
      id: "enterAReason",
      name: "enterAReason",
      maxlength: 300,
      classes: "govuk-textarea govuk-js-character-count",
      label: {
        text: pageContent.characterCountLabelEnterAReason
      },
      ...(data.enterAReason ? { value: data.enterAReason } : {}),
      errorMessage: getFieldError(errorList, "#enterAReason")
    }
  })

  const defaultBacklink = data.hasRestriction && config.enableSpeciesWarning ? `${previousPathSpeciesWarning}/${data.applicationIndex}` : `${previousPathSpeciesName}/${data.applicationIndex}`
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
    hasRestriction: species.hasRestriction, 
    ...request.payload
  }
  return h.view(pageId, createModel(err, pageData)).takeover()
}

const anotherSourceCodesPlantValues = textContent.sourceCode.plant.anotherSourceCodes.map(
  (e) => e.value
)

const anotherSourceCodesAnimalValues = textContent.sourceCode.animal.anotherSourceCodes.map(
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
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
        kingdom: species.kingdom,
        hasRestriction: species.hasRestriction, 
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
          sourceCode: Joi.string().required().valid("W", "R", "D", "C", "F", "I", "O", "X", "A", "U", "Y"),
          anotherSourceCodeForI: Joi.when("sourceCode", {
            is: "I",
            then: Joi.string().valid(...anotherSourceCodesAnimalValues, ...anotherSourceCodesPlantValues).required()
          }),
          anotherSourceCodeForO: Joi.when("sourceCode", {
            is: "O",
            then: Joi.string().valid(...anotherSourceCodesAnimalValues, ...anotherSourceCodesPlantValues).required()
          }),
          enterAReason: Joi.when("sourceCode", {
            is: "U",
            then: Joi.string().regex(COMMENTS_REGEX).required()
          })
        }),

        failAction: failAction
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        const animalSchema = Joi.object({ 
          sourceCode: Joi.string().required().valid("W", "R", "D", "C", "F", "I", "O", "X", "U"),
          enterAReason: Joi.string().max(300).allow("", null),
        })
        const plantSchema = Joi.object({ 
          sourceCode:  Joi.string().required().valid("W", "D", "A", "I", "O", "X", "U", "Y"),
          enterAReason: Joi.string().max(300).allow("", null),
        })
        const payloadSchema = species.kingdom === "Animalia" ? animalSchema : plantSchema
        const modifiedEnterAReason = request.payload.enterAReason.replace(/\r/g, '')
       
        const result = payloadSchema.validate({
          sourceCode: request.payload.sourceCode,
          enterAReason: modifiedEnterAReason},  { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)
        }

        species.sourceCode = request.payload.sourceCode
        species.anotherSourceCodeForI = request.payload.sourceCode === "I" ? request.payload.anotherSourceCodeForI.toUpperCase() : ""
        species.anotherSourceCodeForO = request.payload.sourceCode === "O" ? request.payload.anotherSourceCodeForO.toUpperCase() : ""
        species.enterAReason = request.payload.sourceCode === "U" ? request.payload.enterAReason.replace(/\r/g, '') : ""
 
        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        const redirectTo = submission.permitType === 'article10' ? `${nextPathSpecimenOrigin}/${applicationIndex}` : `${nextPathPurposeCode}/${applicationIndex}`
        
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
