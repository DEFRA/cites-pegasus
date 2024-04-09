const Joi = require('joi')
const { urlPrefix, maxNumberOfUniqueIdentifiers } = require("../../config/config")
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

function createModel(errors, data) {


  const commonContent = textContent.common
  const pageContent = textContent.uniqueIdentificationMark

  const fields = []
  let pageContentErrorMessages = {}
  for (let i = 0; i < data.numberOfMarks && i < maxNumberOfUniqueIdentifiers; i++) {
    fields.push(`uniqueIdentificationMarkType${i}`)
    fields.push(`uniqueIdentificationMark${i}`)

    for (const property in pageContent.errorMessages) {
      const propertyParts = property.split(".")
      const newPropertyName = propertyParts[0] + "." + propertyParts[1] + i + "." + propertyParts[2] + "." + propertyParts[3]
      pageContentErrorMessages[newPropertyName] = pageContent.errorMessages[property]
    }
  }

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContentErrorMessages }, fields)

  const selectItems = Object.entries(commonContent.uniqueIdentificationMarkTypes)
    .filter(([key, value]) => key !== 'unmarked')
    .map(([key, value]) => ({
      text: value,
      value: key
    }));

  selectItems.unshift({ text: pageContent.inputSelectDefaultUniqueIdentificationMarkType, value: '' });

  const marks = []

  for (let i = 0; i < data.numberOfMarks && i < maxNumberOfUniqueIdentifiers; i++) {
    let markPair = null
    if (i < data.uniqueIdentificationMarks.length) {
      markPair = data.uniqueIdentificationMarks[i]
    }
    marks.push({
      markIndex: i,
      showAddMarkButton: i === (data.numberOfMarks - 1) && i < (maxNumberOfUniqueIdentifiers - 1),
      showRemoveMarkButton: data.numberOfMarks > 1,
      fieldsetMark: {
        classes: "add-another__item",
        legend: {
          text: pageContent.markHeader.replace('##MARK_NUMBER##', (i + 1)),
          classes: "govuk-fieldset__legend--m add-another__title",
          isPageHeading: false
        }
      },
      selectUniqueIdentificationMarkType: {
        id: "uniqueIdentificationMarkType" + i,
        name: "uniqueIdentificationMarkType" + i,
        label: {
          text: pageContent.inputLabelUniqueIdentificationMarkType
        },
        items: selectItems,
        value: markPair?.uniqueIdentificationMarkType,
        errorMessage: getFieldError(errorList, "#uniqueIdentificationMarkType" + i)
      },
      inputUniqueIdentificationMark: {
        id: "uniqueIdentificationMark" + i,
        name: "uniqueIdentificationMark" + i,
        label: {
          text: pageContent.inputLabelUniqueIdentificationMark,
          isPageHeading: false
        },
        value: markPair?.uniqueIdentificationMark,
        errorMessage: getFieldError(errorList, "#uniqueIdentificationMark" + i)
      }
    })
  }

  const defaultBacklink = `${previousPathHasUniqueMark}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  const pageTitle = errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle,
    pageHeader: pageContent.pageHeader,
    pageBody: pageContent.pageBody,
    buttonAdd: pageContent.buttonAdd,
    buttonRemove: pageContent.buttonRemove,
    numberOfMarks: data.numberOfMarks,
    marks
  }
  return { ...commonContent, ...model }
}

function isDuplicateValidator(uniqueIdentificationMark, helpers, markIndex, uniqueIdentificationMarks, submission, applicationIndex) {

  const uniqueIdentificationMarkType = uniqueIdentificationMarks[markIndex].uniqueIdentificationMarkType

  if (!uniqueIdentificationMark || !uniqueIdentificationMarkType) {
    return uniqueIdentificationMark
  }

  const applicationDuplicates = getDuplicateUniqueIdentifiersWithinThisApplication(uniqueIdentificationMarks, uniqueIdentificationMarkType, uniqueIdentificationMark)

  if (applicationDuplicates.length > 1) {
    const duplicateIndex = applicationDuplicates.findIndex(obj => obj.index === markIndex)

    if (duplicateIndex !== 0) {//Only show the error if it's the second or more instance of that mark
      return helpers.error('any.applicationDuplicate', { customLabel: `uniqueIdentificationMark${markIndex}` })
    }
  }

  const submissionDuplicate = getDuplicateUniqueIdentifiersWithinThisSubmission(submission, uniqueIdentificationMarkType, uniqueIdentificationMark, applicationIndex)
  if (submissionDuplicate.length) {
    return helpers.error('any.submissionDuplicate', { customLabel: `uniqueIdentificationMark${markIndex}` })
  }

  return uniqueIdentificationMark;
}

function getDuplicateUniqueIdentifiersWithinThisApplication(uniqueIdentificationMarks, uniqueIdentificationMarkType, uniqueIdentificationMark) {
  return uniqueIdentificationMarks.filter(markPair =>
    uniqueIdentificationMarkType === markPair.uniqueIdentificationMarkType
    && uniqueIdentificationMark.toLowerCase() === markPair.uniqueIdentificationMark.toLowerCase())
}

function getDuplicateUniqueIdentifiersWithinThisSubmission(submission, uniqueIdentificationMarkType, uniqueIdentificationMark, applicationIndex) {
  const otherAppsWithSameSpecies = submission.applications.filter(app =>
    app.applicationIndex !== applicationIndex
    && app.species.speciesName.toLowerCase() === submission.applications[applicationIndex].species.speciesName.toLowerCase()
    && app.species?.uniqueIdentificationMarks
    && app.species?.hasUniqueIdentificationMark
  )
  return otherAppsWithSameSpecies.filter(app => {
    return app.species?.uniqueIdentificationMarks.find(mark =>
      mark.uniqueIdentificationMarkType === uniqueIdentificationMarkType
      && mark.uniqueIdentificationMark.toLowerCase() === uniqueIdentificationMark.toLowerCase()
    )
  })
}

function getUniqueIdentificationMarksFromPayload(payload) {
  const uniqueIdentificationMarks = []
  for (let i = 0; i < payload.numberOfMarks && i < maxNumberOfUniqueIdentifiers; i++) {
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