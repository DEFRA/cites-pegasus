const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")

const textContent = require("../content/text-content")
const pageId = "specimen-type"
const currentPath = `${urlPrefix}/${pageId}`
const nextPathTradeTerm = `${urlPrefix}/trade-term-code`
const nextPathQuantity = `${urlPrefix}/quantity`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.specimenType

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["specimenType"]
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

  let radioOptions = null

  if (data.kingdom === "Animalia") {
    radioOptions = [
      {
        value: "animalLiving",
        text: pageContent.radioOptionAnimalLiving,
        checked: isChecked(data.specimenType, "animalLiving")
      },
      {
        value: "animalPart",
        text: pageContent.radioOptionAnimalPart,
        checked: isChecked(data.specimenType, "animalPart")
      },
      {
        value: "animalWorked",
        text: pageContent.radioOptionAnimalWorked,
        checked: isChecked(data.specimenType, "animalWorked")
      },
      {
        value: "animalCoral",
        text: pageContent.radioOptionAnimalCoral,
        checked: isChecked(data.specimenType, "animalCoral")
      }
    ]
  } else {
    radioOptions = [
      {
        value: "plantLiving",
        text: pageContent.radioOptionPlantLiving,
        checked: isChecked(data.specimenType, "plantLiving")
      },
      {
        value: "plantProduct",
        text: pageContent.radioOptionPlantProduct,
        hint: { text: pageContent.radioOptionPlantProductHint },
        checked: isChecked(data.specimenType, "plantProduct")
      },
      {
        value: "plantWorked",
        text: pageContent.radioOptionPlantWorked,
        hint: { text: pageContent.radioOptionPlantWorkedHint },
        checked: isChecked(data.specimenType, "plantWorked")
      }
    ]
  }

  const model = {
    backLink: data.permitType === 'article10' ? `${urlPrefix}/use-certificate-for/${data.applicationIndex}` : `${urlPrefix}/purpose-code/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
      captionText: data.speciesName,

    inputSpecimenType: {
      idPrefix: "specimenType",
      name: "specimenType",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: radioOptions,
      errorMessage: getFieldError(errorList, "#specimenType")
    }
  }
  return { ...commonContent, ...model }
}

function failAction(request, h, err) {
  const submission = getSubmission(request)
  const species = submission.applications[request.params.applicationIndex].species

  const pageData = {
    permitType: submission.permitType,
    applicationIndex: request.params.applicationIndex,
    speciesName: species.speciesName,
    kingdom: species.kingdom,
    specimenType: request.payload.specimenType
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
        validateSubmission(submission, `${pageId}/${request.params.applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const species = submission.applications[applicationIndex].species
      const pageData = {
        permitType: submission.permitType,
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
        kingdom: species.kingdom,
        specimenType: species.specimenType
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
          specimenType: Joi.string().required().valid('animalLiving', 'animalPart', 'animalWorked', 'animalCoral', 'plantLiving', 'plantWorked', 'plantProduct')
        }),
        failAction: failAction
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        const animalSchema = Joi.string().required().valid('animalLiving', 'animalPart', 'animalWorked', 'animalCoral')
        const plantSchema = Joi.string().required().valid('plantLiving', 'plantWorked', 'plantProduct')

        const payloadSchema = Joi.object({ specimenType: species.kingdom === 'Animalia' ? animalSchema : plantSchema })

        const result = payloadSchema.validate(request.payload, { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)          
        }

        const isWorkedItem = request.payload.specimenType === 'animalWorked' || request.payload.specimenType === 'plantWorked'

        species.specimenType = request.payload.specimenType

        if(!isWorkedItem){
          species.createdDate = null
        }

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${request.params.applicationIndex}`)
        }
        catch (err) {
          console.log(err);
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        if(isWorkedItem){
          return h.redirect(`${nextPathQuantity}/${request.params.applicationIndex}`)
        }

        return h.redirect(`${nextPathTradeTerm}/${request.params.applicationIndex}`)
      }
    }
  }

]
