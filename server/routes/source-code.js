const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { permitType: pt } = require('../lib/permit-type-helper')
const config = require('../../config/config')
const { COMMENTS_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const lodash = require('lodash')
const nunjucks = require('nunjucks')
const { checkChangeRouteExit } = require('../lib/change-route')
const { govukClass, stringLength } = require('../lib/constants')
const pageId = 'source-code'
const viewName = 'application-radios-layout'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathSpeciesName = `${urlPrefix}/species-name`
const previousPathSpeciesWarning = `${urlPrefix}/species-warning`
const nextPathPurposeCode = `${urlPrefix}/purpose-code`
const nextPathSpecimenOrigin = `${urlPrefix}/specimen-origin`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel (errors, data) {
  const commonContent = textContent.common
  const isAnimal = data.kingdom === 'Animalia'
  const pageContent = isAnimal ? textContent.sourceCode.animal : textContent.sourceCode.plant
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['sourceCode', 'anotherSourceCodeForI', 'anotherSourceCodeForO', 'enterAReason'])

  const anotherSourceCodeI = lodash.cloneDeep([
    { text: pageContent.anotherSourceCodePrompt, value: null },
    ...pageContent.anotherSourceCodes.filter(x => x.showForI === true)
  ])

  anotherSourceCodeI.forEach((e) => {
    if (e.value === data.anotherSourceCodeForI) { e.selected = 'true' }
  })

  const anotherSourceCodeO = lodash.cloneDeep([
    { text: pageContent.anotherSourceCodePrompt, value: null },
    ...pageContent.anotherSourceCodes.filter(x => x.showForO === true)
  ])

  anotherSourceCodeO.forEach((e) => {
    if (e.value === data.anotherSourceCodeForO) { e.selected = 'true' }
  })

  let renderString = "{% from 'dist/govuk/components/select/macro.njk' import govukSelect %} \n {{govukSelect(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const sourceInputForI = nunjucks.renderString(renderString, {
    input: {
      id: 'anotherSourceCodeForI',
      name: 'anotherSourceCodeForI',
      items: anotherSourceCodeI,
      errorMessage: getFieldError(errorList, '#anotherSourceCodeForI')
    }
  })

  const sourceInputForO = nunjucks.renderString(renderString, {
    input: {
      id: 'anotherSourceCodeForO',
      name: 'anotherSourceCodeForO',
      items: anotherSourceCodeO,
      errorMessage: getFieldError(errorList, '#anotherSourceCodeForO')
    }
  })

  renderString = "{% from 'dist/govuk/components/character-count/macro.njk' import govukCharacterCount %} \n {{govukCharacterCount(input)}}"

  const sourceCharacterCount = nunjucks.renderString(renderString, {
    input: {
      id: 'enterAReason',
      name: 'enterAReason',
      maxlength: stringLength.max300,
      classes: 'govuk-textarea govuk-js-character-count',
      label: {
        text: pageContent.characterCountLabelEnterAReason
      },
      ...(data.enterAReason ? { value: data.enterAReason } : {}),
      errorMessage: getFieldError(errorList, '#enterAReason')
    }
  })

  const backLink = getBackLink(data)

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,

    radios: {
      name: 'sourceCode',
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: 'govuk-fieldset__legend--l'
        }
      },
      items: getItems(pageContent, data, sourceCharacterCount, sourceInputForI, sourceInputForO, isAnimal),
      errorMessage: getFieldError(errorList, '#sourceCode')
    }
  }
  return { ...commonContent, ...model }
}

function getItems (pageContent, data, sourceCharacterCount, sourceInputForI, sourceInputForO, isAnimal) {
  return [
    {
      value: 'W',
      text: pageContent.radioOptionW,
      hint: { text: pageContent.radioOptionWHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'W')
    },
    isAnimal && {
      value: 'R',
      text: pageContent.radioOptionR,
      hint: { text: pageContent.radioOptionRHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'R')
    },
    {
      value: 'D',
      text: pageContent.radioOptionD,
      hint: { text: pageContent.radioOptionDHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'D')
    },
    isAnimal && {
      value: 'C',
      text: pageContent.radioOptionC,
      hint: { html: pageContent.radioOptionCHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'C')
    },
    isAnimal && {
      value: 'F',
      text: pageContent.radioOptionF,
      hint: { html: pageContent.radioOptionFHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'F')
    },
    !(isAnimal) && {
      value: 'A',
      text: pageContent.radioOptionA,
      hint: { text: pageContent.radioOptionAHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'A')
    },
    {
      value: 'I',
      text: pageContent.radioOptionI,
      hint: { text: pageContent.radioOptionIHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'I'),
      conditional: {
        html: sourceInputForI
      }
    },
    {
      value: 'O',
      text: pageContent.radioOptionO,
      hint: { text: pageContent.radioOptionOHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'O'),
      conditional: {
        html: sourceInputForO
      }
    },
    {
      value: 'X',
      text: pageContent.radioOptionX,
      hint: { text: pageContent.radioOptionXHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'X')
    },
    !(isAnimal) && {
      value: 'Y',
      text: pageContent.radioOptionY,
      hint: { html: pageContent.radioOptionYHint },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'Y')
    },
    {
      divider: pageContent.dividerText
    },
    {
      value: 'U',
      text: pageContent.radioOptionU,
      hint: {
        text: pageContent.radioOptionUHint
      },
      label: {
        classes: govukClass.FONT_WEIGHT_BOLD
      },
      checked: isChecked(data.sourceCode, 'U'),
      conditional: {
        html: sourceCharacterCount
      }
    }
  ]
}

function getBackLink (data) {
  const defaultBacklink = data.hasRestriction && config.enableSpeciesWarning ? `${previousPathSpeciesWarning}/${data.applicationIndex}` : `${previousPathSpeciesName}/${data.applicationIndex}`
  return data.backLinkOverride ? data.backLinkOverride : defaultBacklink
}

function failAction (request, h, err) {
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
  return h.view(viewName, createModel(err, pageData)).takeover()
}

const anotherSourceCodesPlantValuesForI = textContent.sourceCode.plant.anotherSourceCodes.filter(x => x.showForI === true).map(
  (e) => e.value
)

const anotherSourceCodesPlantValuesForO = textContent.sourceCode.plant.anotherSourceCodes.filter(x => x.showForO === true).map(
  (e) => e.value
)

const anotherSourceCodesAnimalValuesForI = textContent.sourceCode.animal.anotherSourceCodes.filter(x => x.showForI === true).map(
  (e) => e.value
)

const anotherSourceCodesAnimalValuesForO = textContent.sourceCode.animal.anotherSourceCodes.filter(x => x.showForO === true).map(
  (e) => e.value
)

module.exports = [
  {
    method: 'GET',
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

      return h.view(viewName, createModel(null, pageData))
    }
  },
  {
    method: 'POST',
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          sourceCode: Joi.string().required().valid('W', 'R', 'D', 'C', 'F', 'I', 'O', 'X', 'A', 'U', 'Y'),
          anotherSourceCodeForI: Joi.when('sourceCode', {
            is: 'I',
            then: Joi.string().valid(...anotherSourceCodesAnimalValuesForI, ...anotherSourceCodesPlantValuesForI).required()
          }),
          anotherSourceCodeForO: Joi.when('sourceCode', {
            is: 'O',
            then: Joi.string().valid(...anotherSourceCodesAnimalValuesForO, ...anotherSourceCodesPlantValuesForO).required()
          }),
          enterAReason: Joi.when('sourceCode', {
            is: 'U',
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
          sourceCode: Joi.string().required().valid('W', 'R', 'D', 'C', 'F', 'I', 'O', 'X', 'U'),
          enterAReason: Joi.string().max(stringLength.max300).allow('', null)
        })
        const plantSchema = Joi.object({
          sourceCode: Joi.string().required().valid('W', 'D', 'A', 'I', 'O', 'X', 'U', 'Y'),
          enterAReason: Joi.string().max(stringLength.max300).allow('', null)
        })
        const payloadSchema = species.kingdom === 'Animalia' ? animalSchema : plantSchema
        const modifiedEnterAReason = request.payload.enterAReason.replace(/\r/g, '')

        const result = payloadSchema.validate({
          sourceCode: request.payload.sourceCode,
          enterAReason: modifiedEnterAReason
        }, { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)
        }

        species.sourceCode = request.payload.sourceCode
        species.anotherSourceCodeForI = request.payload.sourceCode === 'I' ? request.payload.anotherSourceCodeForI.toUpperCase() : ''
        species.anotherSourceCodeForO = request.payload.sourceCode === 'O' ? request.payload.anotherSourceCodeForO.toUpperCase() : ''
        species.enterAReason = request.payload.sourceCode === 'U' ? request.payload.enterAReason.replace(/\r/g, '') : ''

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

        const redirectTo = submission.permitType === pt.ARTICLE_10 ? `${nextPathSpecimenOrigin}/${applicationIndex}` : `${nextPathPurposeCode}/${applicationIndex}`

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
