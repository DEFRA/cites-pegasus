const Joi = require('joi')
const { urlPrefix, enableTagIdentifier } = require("../../config/config")
const { getErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, setSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
const { permitType: pt } = require('../lib/permit-type-helper')
const nunjucks = require("nunjucks")
const { payload } = require('@hapi/hapi/lib/validation')
const hasUniqueIdentificationMark = require('./has-unique-identification-mark')
const pageId = 'unique-identification-mark'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathHasUniqueMark = `${urlPrefix}/has-unique-identification-mark`
const nextPathDescLivingAnimal = `${urlPrefix}/describe-living-animal`
const nextPathDescGeneric = `${urlPrefix}/describe-specimen`
const invalidSubmissionPath = `${urlPrefix}/`

const maxNumberOfMarks = 3

function createModel(errors, data) {


  const commonContent = textContent.common
  const pageContent = textContent.uniqueIdentificationMark

  const fields = []
  let pageContentErrorMessages = {}
  for (let i = 0; i < data.numberOfMarks && i < maxNumberOfMarks; i++) {
    fields.push(`uniqueIdentificationMarkType${i}`)
    fields.push(`uniqueIdentificationMark${i}`)

    for (const property in pageContent.errorMessages) {
      const propertyParts = property.split(".")
      const newPropertyName = propertyParts[0] + "." + propertyParts[1] + i + "." + propertyParts[2] + "." + propertyParts[3]
      pageContentErrorMessages[newPropertyName] = pageContent.errorMessages[property]
    }
  }

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContentErrorMessages }, fields)

  let selectItems = [
    { text: 'Select mark', value: '' },
    { text: pageContent.radioOptionMicrochipNumber, value: 'MC' },
    { text: pageContent.radioOptionClosedRingNumber, value: 'CR' },
    { text: pageContent.radioOptionSplitRingNumber, value: 'SR' },
    { text: pageContent.radioOptionOtherRingNumber, value: 'OT' },
    { text: pageContent.radioOptionCableTie, value: 'CB' },
    { text: pageContent.radioOptionHuntingTrophy, value: 'HU' },
    { text: pageContent.radioOptionLabel, value: 'LB' },
    { text: pageContent.radioOptionSwissInstitue, value: 'SI' },
    { text: pageContent.radioOptionSerialNumber, value: 'SN' }
  ]

  if (enableTagIdentifier) {
    selectItems.push({ text: pageContent.radioOptionTag, value: 'TG' })
  }

  const marks = []

  for (let i = 0; i < data.numberOfMarks && i < maxNumberOfMarks; i++) {
    let markPair = null
    if (i < data.markPairs.length) {
      markPair = data.markPairs[i]
    }
    marks.push({
      markIndex: i,
      showAddMarkButton: i === (data.numberOfMarks - 1) && i < (maxNumberOfMarks - 1),
      showRemoveMarkButton: data.numberOfMarks > 1,
      fieldsetMark: {
        classes: "add-another__item",
        legend: {
          text: 'Mark ' + (i + 1),
          classes: "govuk-fieldset__legend--m add-another__title",
          isPageHeading: false
        }
      },
      selectUniqueIdentificationMarkType: {
        id: "uniqueIdentificationMarkType" + i,
        name: "uniqueIdentificationMarkType" + i,
        label: {
          text: "Select the identification mark"
        },
        items: selectItems,
        value: markPair?.uniqueIdentificationMarkType,
        errorMessage: getFieldError(errorList, "#uniqueIdentificationMarkType" + i)
      },
      inputUniqueIdentificationMark: {
        id: "uniqueIdentificationMark" + i,
        name: "uniqueIdentificationMark" + i,
        label: {
          text: "Enter the mark number or reference",

          isPageHeading: false
        },
        value: markPair?.uniqueIdentificationMark,
        errorMessage: getFieldError(errorList, "#uniqueIdentificationMark" + i)
      }
    })
  }

  const defaultBacklink = `${previousPathHasUniqueMark}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    pageHeader: "Add unique identification marks",
    numberOfMarks: data.numberOfMarks,
    marks
  }
  return { ...commonContent, ...model }
}


function getRadioItem(uniqueIdentificationMarkType, uniqueIdentificationMark, radioOption, errorList) {

  if (!radioOption.value) {
    return {
      divider: radioOption.text
    }
  }

  const checked = uniqueIdentificationMarkType ? isChecked(uniqueIdentificationMarkType, radioOption.value) : false
  const checkedMarkOrNull = checked ? uniqueIdentificationMark : null
  const html = radioOption.hasInput ? getInputUniqueIdentificationMark('input' + radioOption.value, checkedMarkOrNull, errorList) : ""

  return {
    value: radioOption.value,
    text: radioOption.text,
    checked: checked,
    conditional: {
      html: html
    }
  }
}

function getInputUniqueIdentificationMark(inputId, uniqueIdentificationMark, errorList) {
  const renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"
  const inputModel = {
    input: {
      id: inputId,
      name: inputId,
      classes: "govuk-input govuk-input--width-10",
      label: { text: textContent.uniqueIdentificationMark.inputLabelUniqueIdentificationMark },
      ...(uniqueIdentificationMark ? { value: uniqueIdentificationMark } : {}),
      errorMessage: getFieldError(errorList, "#" + inputId)
    }
  }

  return nunjucks.renderString(renderString, inputModel)
}

function isDuplicateValidator(value, helpers, markPairs, submission, applicationIndex) {

  const errors = []

  const applicationDuplicates = getDuplicateUniqueIdentifiersWithinThisApplication(markPairs, value.uniqueIdentificationMarkType, value.uniqueIdentificationMark)

  if (applicationDuplicates.length > 1) {
    const duplicateIndex = applicationDuplicates.findIndex(obj => obj.index === value.index)

    if (duplicateIndex !== 0) {//Only show the error if it's the second or more instance of that mark
      return helpers.error('any.applicationDuplicate', { customLabel: `uniqueIdentificationMark${value.index}` })
    }
  }

  const submissionDuplicates = getDuplicateUniqueIdentifiersWithinThisSubmission(submission, value.uniqueIdentificationMarkType, value.uniqueIdentificationMark, applicationIndex)

  //TODO - Test that this validation works correctly
  if (submissionDuplicates.length) {
    return helpers.error('any.submissionDuplicate', { customLabel: `uniqueIdentificationMark${value.index}` })
  }

  return value;
}

function getDuplicateUniqueIdentifiersWithinThisApplication(markPairs, uniqueIdentificationMarkType, uniqueIdentificationMark) {
  return markPairs.filter(markPair =>
    uniqueIdentificationMarkType === markPair.uniqueIdentificationMarkType
    && uniqueIdentificationMark === markPair.uniqueIdentificationMark)
}

function getDuplicateUniqueIdentifiersWithinThisSubmission(submission, uniqueIdentificationMarkType, uniqueIdentificationMark, applicationIndex) {
  return submission.applications.filter(app =>
    app.applicationIndex !== applicationIndex
    && app.species.speciesName === submission.applications[applicationIndex].species.speciesName
    && app.species.uniqueIdentificationMarkType === uniqueIdentificationMarkType
    && app.species.uniqueIdentificationMark === uniqueIdentificationMark
  ).map(app => app.species.uniqueIdentificationMark)
}

function getMarkPairsFromPayload(payload) {
  const markPairs = []
  for (let i = 0; i < payload.numberOfMarks && i < maxNumberOfMarks; i++) {
    markPairs.push({
      index: i,
      uniqueIdentificationMarkType: payload[`uniqueIdentificationMarkType${i}`],
      uniqueIdentificationMark: payload[`uniqueIdentificationMark${i}`]?.toUpperCase().replace(/ /g, '')
    })
  }
  return markPairs
}

function failAction(request, h, err) {
  const { applicationIndex } = request.params
  const submission = getSubmission(request)
  const species = submission.applications[applicationIndex].species

  const uniqueIdentificationMark = request.payload['input' + request.payload.uniqueIdentificationMarkType] || null

  const markPairs = getMarkPairsFromPayload(request.payload)

  const pageData = {
    formActionPage: `${currentPath}/{applicationIndex}`,
    backLinkOverride: checkChangeRouteExit(request, true),
    applicationIndex: request.params.applicationIndex,
    specimenType: species.specimenType,
    permitType: submission.permitType,
    numberOfMarks: parseInt(request.payload.numberOfMarks) || 1,
    markPairs
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
        formActionPage: `${currentPath}/{applicationIndex}`,
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        specimenType: species.specimenType,
        permitType: submission.permitType,
        numberOfMarks: species.uniqueIdentificationMarks?.length || 1,
        markPairs: species.uniqueIdentificationMarks || []
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },
  {//TODO REMOVE THIS HANDLER - IT WAS JUST FOR ASSISTING DEV WORK
    method: "GET",
    path: `${currentPath}/{applicationIndex}/delete`,
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
      const species = submission.applications[applicationIndex].species

      if (species.hasOwnProperty('hasUniqueIdentificationMark')) {
        delete species.hasUniqueIdentificationMark
      }
      if (species.hasOwnProperty('uniqueIdentificationMark')) {
        delete species.uniqueIdentificationMark
      }
      if (species.hasOwnProperty('uniqueIdentificationMarkType')) {
        delete species.uniqueIdentificationMarkType
      }
      if (species.hasOwnProperty('uniqueIdentificationMarks')) {
        delete species.uniqueIdentificationMarks
      }

      if (species.hasOwnProperty('numberOfUniqueIdentificationMarks')){
        delete species.numberOfUniqueIdentificationMarks
      }

      try {
        setSubmission(request, submission)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      return h.redirect(`${previousPathHasUniqueMark}/${applicationIndex}`)
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}/addMark`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: {
          abortEarly: false
        },
        failAction,
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        const markPairs = getMarkPairsFromPayload(request.payload)

        const pageData = {
          formActionPage: `${currentPath}/{applicationIndex}`,
          backLinkOverride: checkChangeRouteExit(request, true),
          applicationIndex: applicationIndex,
          specimenType: species.specimenType,
          permitType: submission.permitType,
          numberOfMarks: parseInt(request.payload.numberOfMarks) + 1,
          markPairs
        }

        return h.view(pageId, createModel(null, pageData))//.takeover()      

      }
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}/removeMark/{markIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required(),
          markIndex: Joi.number().required()
        }),
        options: {
          abortEarly: false
        },
        failAction,
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        const markPairs = getMarkPairsFromPayload(request.payload).filter(markPair => markPair.index !== request.params.markIndex)

        const pageData = {
          formActionPage: `${currentPath}/{applicationIndex}`,
          backLinkOverride: checkChangeRouteExit(request, true),
          applicationIndex: applicationIndex,
          specimenType: species.specimenType,
          permitType: submission.permitType,
          numberOfMarks: markPairs.length,
          markPairs
        }

        return h.view(pageId, createModel(null, pageData))
      }
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}/continue`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: {
          abortEarly: false
        },
        failAction,
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)

        const data = {
          numberOfMarks: parseInt(request.payload.numberOfMarks),
          markPairs: getMarkPairsFromPayload(request.payload)
        }

        const schema = Joi.object({
          numberOfMarks: Joi.number().required(),
          markPairs: Joi.array().items(Joi.object({
            index: Joi.number(),
            uniqueIdentificationMarkType: Joi.string().required().valid("MC", "CR", "SR", "OT", "CB", "HU", "LB", "SI", "SN", "TG"),
            uniqueIdentificationMark: Joi.string().required().min(3).max(150)
          }).custom((value, helpers) => isDuplicateValidator(value, helpers, data.markPairs, submission, applicationIndex), 'Custom validation example')
          )
        })

        const result = schema.validate(data, { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)
        }

        const species = submission.applications[applicationIndex].species
        species.uniqueIdentificationMarks = data.markPairs

        try {
          setSubmission(request, submission, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        let redirectTo = `${nextPathDescGeneric}/${applicationIndex}`
        if (species.specimenType === 'animalLiving') {
          redirectTo = `${nextPathDescLivingAnimal}/${applicationIndex}`
        }

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)

      }
    }
  }
]