const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, setSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { permitType: pt } = require('../lib/permit-type-helper')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "specimen-type"
const currentPath = `${urlPrefix}/${pageId}`
const nextPathQuantity = `${urlPrefix}/quantity`
const nextPathUniqueId = `${urlPrefix}/unique-identification-mark`
const nextPathMultipleSpecimens = `${urlPrefix}/multiple-specimens`
const invalidSubmissionPath = `${urlPrefix}/`

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

  const defaultBacklink = data.permitType === pt.ARTICLE_10 ? `${urlPrefix}/use-certificate-for/${data.applicationIndex}` : `${urlPrefix}/purpose-code/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,

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
    backLinkOverride: checkChangeRouteExit(request, true),
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
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[applicationIndex].species
      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
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
        const application = submission.applications[applicationIndex]
        const species = application.species

        const animalSchema = Joi.string().required().valid('animalLiving', 'animalPart', 'animalWorked', 'animalCoral')
        const plantSchema = Joi.string().required().valid('plantLiving', 'plantWorked', 'plantProduct')

        const payloadSchema = Joi.object({ specimenType: species.kingdom === 'Animalia' ? animalSchema : plantSchema })

        const result = payloadSchema.validate(request.payload, { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)          
        }

        const isWorkedItem = request.payload.specimenType === 'animalWorked' || request.payload.specimenType === 'plantWorked'

        const isChange = species.specimenType && species.specimenType !== request.payload.specimenType

        species.specimenType = request.payload.specimenType

        if(isChange){
          species.quantity = null
          species.unitOfMeasurement = null
          species.createdDate = null
          species.isTradeTermCode = null
          species.tradeTermCode = null
          species.tradeTermCodeDesc = null
          species.uniqueIdentificationMarkType = null
          species.uniqueIdentificationMark = null
          species.isMultipleSpecimens = null
          species.numberOfUnmarkedSpecimens = null
          species.specimenDescriptionLivingAnimal = null
          species.specimenDescriptionGeneric = null
          species.maleParentDetails = null
          species.femaleParentDetails = null
          species.sex = null
          species.dateOfBirth = null
          application.isBreeder = null
        }

        if(!isWorkedItem){
          species.createdDate = null
        }

        try {
          setSubmission(request, submission, `${pageId}/${request.params.applicationIndex}`)
          //mergeSubmission(request, { applications: submission.applications }, `${pageId}/${request.params.applicationIndex}`)
        }
        catch (err) {
          console.error(err);
          return h.redirect(invalidSubmissionPath)
        }

        if (isChange) {
          setDataRemoved(request)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        let redirectTo =`${nextPathQuantity}/${request.params.applicationIndex}`

        if (species.specimenType === 'animalLiving'){
          if (submission.permitType === pt.ARTICLE_10) {
            redirectTo = `${nextPathUniqueId}/${request.params.applicationIndex}`
          } else {
            redirectTo = `${nextPathMultipleSpecimens}/${request.params.applicationIndex}`
          }
        }
        
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)

      }
    }
  }

]
