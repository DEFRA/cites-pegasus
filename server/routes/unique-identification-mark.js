const Joi = require('joi')
const { urlPrefix, enableTagIdentifier } = require("../../config/config")
const { getErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, setSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
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
    if (i < data.uniqueIdentificationMarks.length) {
      markPair = data.uniqueIdentificationMarks[i]
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

function isDuplicateValidator(uniqueIdentificationMark, helpers, markIndex, uniqueIdentificationMarks, submission, applicationIndex) {

  const uniqueIdentificationMarkType = uniqueIdentificationMarks[markIndex].uniqueIdentificationMarkType

  if(!uniqueIdentificationMark || !uniqueIdentificationMarkType) {
    return uniqueIdentificationMark
  }

  const applicationDuplicates = getDuplicateUniqueIdentifiersWithinThisApplication(uniqueIdentificationMarks, uniqueIdentificationMarkType, uniqueIdentificationMark)

  if (applicationDuplicates.length > 1) {
    const duplicateIndex = applicationDuplicates.findIndex(obj => obj.index === markIndex)

    if (duplicateIndex !== 0) {//Only show the error if it's the second or more instance of that mark
      return helpers.error('any.applicationDuplicate', { customLabel: `uniqueIdentificationMark${markIndex}` })
    }
  }

  // //TODO - Test that this validation works correctly
  const submissionDuplicates = getDuplicateUniqueIdentifiersWithinThisSubmission(submission, uniqueIdentificationMarkType, uniqueIdentificationMark, applicationIndex)
  if (submissionDuplicates.length) {
    return helpers.error('any.submissionDuplicate', { customLabel: `uniqueIdentificationMark${markIndex}` })
  }

  return uniqueIdentificationMark;
}

function getDuplicateUniqueIdentifiersWithinThisApplication(uniqueIdentificationMarks, uniqueIdentificationMarkType, uniqueIdentificationMark) {
  return uniqueIdentificationMarks.filter(markPair =>
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

function getUniqueIdentificationMarksFromPayload(payload) {
  const uniqueIdentificationMarks = []
  for (let i = 0; i < payload.numberOfMarks && i < maxNumberOfMarks; i++) {
    uniqueIdentificationMarks.push({
      index: i,
      uniqueIdentificationMarkType: payload[`uniqueIdentificationMarkType${i}`],
      uniqueIdentificationMark: payload[`uniqueIdentificationMark${i}`]?.toUpperCase().replace(/ /g, '')
    })
  }
  return uniqueIdentificationMarks
}

function failAction(request, h, err) {
  const { applicationIndex } = request.params
  const submission = getSubmission(request)
  const species = submission.applications[applicationIndex].species
  const uniqueIdentificationMarks = getUniqueIdentificationMarksFromPayload(request.payload)

  const pageData = {
    formActionPage: `${currentPath}/{applicationIndex}`,
    backLinkOverride: checkChangeRouteExit(request, true),
    applicationIndex: request.params.applicationIndex,
    specimenType: species.specimenType,
    permitType: submission.permitType,
    numberOfMarks: parseInt(request.payload.numberOfMarks) || 1,
    uniqueIdentificationMarks
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
        uniqueIdentificationMarks: species.uniqueIdentificationMarks || []
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

      if (species.hasOwnProperty('numberOfUniqueIdentificationMarks')) {
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

        const uniqueIdentificationMarks = getUniqueIdentificationMarksFromPayload(request.payload)

        const pageData = {
          formActionPage: `${currentPath}/{applicationIndex}`,
          backLinkOverride: checkChangeRouteExit(request, true),
          applicationIndex: applicationIndex,
          specimenType: species.specimenType,
          permitType: submission.permitType,
          numberOfMarks: parseInt(request.payload.numberOfMarks) + 1,
          uniqueIdentificationMarks
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

        const uniqueIdentificationMarks = getUniqueIdentificationMarksFromPayload(request.payload).filter(markPair => markPair.index !== request.params.markIndex)

        const pageData = {
          formActionPage: `${currentPath}/{applicationIndex}`,
          backLinkOverride: checkChangeRouteExit(request, true),
          applicationIndex: applicationIndex,
          specimenType: species.specimenType,
          permitType: submission.permitType,
          numberOfMarks: uniqueIdentificationMarks.length,
          uniqueIdentificationMarks
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
        //payload: payloadValidation,
        options: {
          abortEarly: false
        },
        failAction,
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)

        const uniqueIdentificationMarks = getUniqueIdentificationMarksFromPayload(request.payload)

        const schemaObject = {
          numberOfMarks: Joi.number().required()
        }
        
        for (let i = 0; i < request.payload.numberOfMarks; i++) {
          schemaObject[`uniqueIdentificationMarkType${i}`] = Joi.string().required().valid("MC", "CR", "SR", "OT", "CB", "HU", "LB", "SI", "SN", "TG"),
            schemaObject[`uniqueIdentificationMark${i}`] = Joi.string().required().min(3).max(150).custom((value, helpers) => isDuplicateValidator(value, helpers, i, uniqueIdentificationMarks, submission, applicationIndex), 'Custom validation')
        }


        const result = Joi.object(schemaObject).validate(request.payload, { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)
        }

        const species = submission.applications[applicationIndex].species
        species.uniqueIdentificationMarks = uniqueIdentificationMarks

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