const Joi = require('joi')
const { urlPrefix, enableTagIdentifier } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
const { permitType: pt } = require('../lib/permit-type-helper')
const nunjucks = require("nunjucks")
const pageId = 'unique-identification-mark'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathHasUniqueMark = `${urlPrefix}/has-unique-identification-mark`
const nextPathDescLivingAnimal = `${urlPrefix}/describe-living-animal`
const nextPathDescGeneric = `${urlPrefix}/describe-specimen`
const invalidSubmissionPath = `${urlPrefix}/`

const maxNumberOfMarks = 5

function createModel(errors, data) {


  const commonContent = textContent.common
  const pageContent = textContent.uniqueIdentificationMark

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["uniqueIdentificationMarkType", "inputCB", "inputCR", "inputHU", "inputLB", "inputMC", "inputOT", "inputSN", "inputSR", "inputSI", "inputTG"]
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

  // nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })
  // const radioItems = radioOptions.map(x => getRadioItem(data.uniqueIdentificationMarkType, data.uniqueIdentificationMark, x, errorList))



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
        legend: {
          text: 'Mark ' + (i + 1),
          classes: "govuk-fieldset__legend--m",
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

function getUniqueIdentificationMarkInputSchema(uniqueIdentificationMarkType) {
  return Joi.when('uniqueIdentificationMarkType', {
    is: uniqueIdentificationMarkType,
    then: Joi.string().required().min(3).max(150)
  })
}

function isDuplicateValidator(value, helpers, submission, applicationIndex) {

  const uniqueIdentifiers = getExistingUniqueIdentifiersForSpeciesAndMarkType(submission, value.uniqueIdentificationMarkType, applicationIndex)

  if (uniqueIdentifiers.includes(value.uniqueIdentificationMark)) {
    return helpers.error('any.duplicate', { customLabel: 'input' + value.uniqueIdentificationMarkType });
  }
  return value;
}

function getExistingUniqueIdentifiersForSpeciesAndMarkType(submission, uniqueIdentificationMarkType, applicationIndex) {
  return submission.applications.filter(app =>
    app.applicationIndex !== applicationIndex
    && app.species.speciesName === submission.applications[applicationIndex].species.speciesName
    && app.species.uniqueIdentificationMarkType === uniqueIdentificationMarkType
  ).map(app => app.species.uniqueIdentificationMark)
}

function failAction(request, h, err) {
  const { applicationIndex } = request.params
  const submission = getSubmission(request)
  const species = submission.applications[applicationIndex].species

  const uniqueIdentificationMark = request.payload['input' + request.payload.uniqueIdentificationMarkType] || null
  const pageData = {
    formActionPage: `${currentPath}/{applicationIndex}`,
    backLinkOverride: checkChangeRouteExit(request, true),
    applicationIndex: request.params.applicationIndex,
    specimenType: species.specimenType,
    uniqueIdentificationMark: uniqueIdentificationMark,
    uniqueIdentificationMarkType: request.payload.uniqueIdentificationMarkType,
    permitType: submission.permitType,
    numberOfMarks: request.payload.numberOfMarks || 1
  }
  return h.view(pageId, createModel(err, pageData)).takeover()
}

function generatePayloadSchema(numMarks) {
  const schema = {};
  for (let i = 0; i < numMarks; i++) {
    schema[`uniqueIdentificationMarkType${i}`] = Joi.string().allow('', null);
    schema[`uniqueIdentificationMark${i}`] = Joi.string().allow('', null);
  }
  return Joi.object(schema);
}

function payload(request, h) {
  const numMarks = request.payload.numberOfMarks || 2; // Default to 2 if numberOfUniqueIdentificationMarks is not defined
  return generatePayloadSchema(numMarks);
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
        uniqueIdentificationMarkType: species.uniqueIdentificationMarkType,
        uniqueIdentificationMark: species.uniqueIdentificationMark,
        permitType: submission.permitType,
        numberOfMarks: 1,//TODO Pull this from session and default to 1 if nothing
        markPairs: [] 
      }

      return h.view(pageId, createModel(null, pageData))
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
          payload: payload,
          abortEarly: false
        },
        failAction,
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species
        
        const markPairs = []
        for (let i = 0; i < request.payload.numberOfMarks && i < maxNumberOfMarks; i++) {
          markPairs.push({
            uniqueIdentificationMarkType: request.payload[`uniqueIdentificationMarkType${i}`],
            uniqueIdentificationMark: request.payload[`uniqueIdentificationMark${i}`]
          })
        }

        const pageData = {
          formActionPage: `${currentPath}/{applicationIndex}`,
          backLinkOverride: checkChangeRouteExit(request, true),
          applicationIndex: applicationIndex,
          specimenType: species.specimenType,
          uniqueIdentificationMarkType: species.uniqueIdentificationMarkType,
          uniqueIdentificationMark: species.uniqueIdentificationMark,
          permitType: submission.permitType,
          numberOfMarks: markPairs.length + 1,
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
          payload: payload,
          abortEarly: false
        },
        failAction,
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species
        
        const markPairs = []
        for (let i = 0; i < request.payload.numberOfMarks && i < maxNumberOfMarks; i++) {
          if (i !== request.params.markIndex) {
            markPairs.push({
              uniqueIdentificationMarkType: request.payload[`uniqueIdentificationMarkType${i}`],
              uniqueIdentificationMark: request.payload[`uniqueIdentificationMark${i}`]
            })
          }
        }


        const pageData = {
          formActionPage: `${currentPath}/{applicationIndex}`,
          backLinkOverride: checkChangeRouteExit(request, true),
          applicationIndex: applicationIndex,
          specimenType: species.specimenType,
          uniqueIdentificationMarkType: species.uniqueIdentificationMarkType,
          uniqueIdentificationMark: species.uniqueIdentificationMark,
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
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          uniqueIdentificationMarkType: Joi.string().required().valid("MC", "CR", "SR", "OT", "CB", "HU", "LB", "SI", "SN", "TG", "unmarked"),
          inputCB: getUniqueIdentificationMarkInputSchema("CB"),
          inputCR: getUniqueIdentificationMarkInputSchema("CR"),
          inputHU: getUniqueIdentificationMarkInputSchema("HU"),
          inputLB: getUniqueIdentificationMarkInputSchema("LB"),
          inputMC: getUniqueIdentificationMarkInputSchema("MC"),
          inputOT: getUniqueIdentificationMarkInputSchema("OT"),
          inputSN: getUniqueIdentificationMarkInputSchema("SN"),
          inputTG: getUniqueIdentificationMarkInputSchema("TG"),
          inputSR: getUniqueIdentificationMarkInputSchema("SR"),
          inputSI: getUniqueIdentificationMarkInputSchema("SI"),
        }),
        failAction,
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const uniqueIdentificationMarkType = request.payload.uniqueIdentificationMarkType
        const uniqueIdentificationMark = request.payload['input' + uniqueIdentificationMarkType]?.toUpperCase().replace(/ /g, '')

        if (uniqueIdentificationMarkType !== 'unmarked') {
          const schema = Joi.object({
            uniqueIdentificationMark: Joi.string().required(),
            uniqueIdentificationMarkType: Joi.string().required(),
          }).custom((value, helpers) => isDuplicateValidator(value, helpers, submission, applicationIndex), 'Custom validation example')

          const result = schema.validate({ uniqueIdentificationMark, uniqueIdentificationMarkType: uniqueIdentificationMarkType }, { abortEarly: false })

          if (result.error) {
            return failAction(request, h, result.error)
          }
        }

        const species = submission.applications[applicationIndex].species
        species.uniqueIdentificationMarkType = uniqueIdentificationMarkType
        species.uniqueIdentificationMark = species.uniqueIdentificationMarkType === 'unmarked' ? null : (uniqueIdentificationMark || "")


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