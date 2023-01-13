const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")

const textContent = require("../content/text-content")
const pageId = "specimen-type"
const currentPath = `${urlPrefix}/${pageId}`
const nextPathTradeTerm = `${urlPrefix}/trade-term-code`
const nextPathCreatedDate = `${urlPrefix}/created-date`
const invalidAppDataPath = urlPrefix

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

  const speciesName = data.speciesName
  const quantity = data.quantity
  const specimenNo = data.specimenIndex + 1
  const unitOfMeasurement = data.unitOfMeasurement

  const captionText =
    unitOfMeasurement === "noOfSpecimens"
      ? `${speciesName} (${specimenNo} of ${quantity})`
      : `${speciesName}`

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
    backLink: data.permitType === 'article10' ? `${urlPrefix}/use-certificate-for/${data.speciesIndex}/${data.specimenIndex}` : `${urlPrefix}/purpose-code/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: captionText,

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
  const appData = getAppData(request)
  const pageData = {
    permitType: appData.permitType,
    speciesIndex: request.params.speciesIndex,
    specimenIndex: request.params.specimenIndex,
    speciesName: appData.species[request.params.speciesIndex]?.speciesName,
    quantity: appData.species[request.params.speciesIndex]?.quantity,
    unitOfMeasurement: appData.species[request.params.speciesIndex]?.unitOfMeasurement,
    kingdom: appData.species[request.params.speciesIndex].kingdom,
    specimenType: request.payload.specimenType
  }

  return h.view(pageId, createModel(err, pageData)).takeover()
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{speciesIndex}/{specimenIndex}`,
    options: {
      validate: {
        params: Joi.object({
          speciesIndex: Joi.number().required(),
          specimenIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const appData = getAppData(request)

      try {
        validateAppData(appData, `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const pageData = {
        permitType: appData.permitType,
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        speciesName: appData.species[request.params.speciesIndex]?.speciesName,
        quantity: appData.species[request.params.speciesIndex]?.quantity,
        unitOfMeasurement: appData.species[request.params.speciesIndex]?.unitOfMeasurement,
        kingdom: appData.species[request.params.speciesIndex].kingdom,
        specimenType: appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex].specimenType
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },

  {
    method: "POST",
    path: `${currentPath}/{speciesIndex}/{specimenIndex}`,
    options: {
      validate: {
        params: Joi.object({
          speciesIndex: Joi.number().required(),
          specimenIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          specimenType: Joi.string().required().valid('animalLiving', 'animalPart', 'animalWorked', 'animalCoral', 'plantLiving', 'plantWorked', 'plantProduct')
        }),
        failAction: failAction
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        const animalSchema = Joi.string().required().valid('animalLiving', 'animalPart', 'animalWorked', 'animalCoral')
        const plantSchema = Joi.string().required().valid('plantLiving', 'plantWorked', 'plantProduct')

        const payloadSchema = Joi.object({
          specimenType: appData.species[request.params.speciesIndex].kingdom === 'Animalia' ? animalSchema : plantSchema
        })

        const result = payloadSchema.validate(request.payload, { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)          
        }

        appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex].specimenType = request.payload.specimenType

        try {
          mergeAppData(request, { species: appData.species }, `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
        }
        catch (err) {
          console.log(err);
          return h.redirect(`${invalidAppDataPath}/`)
        }
        if(request.payload.specimenType === 'animalWorked' || request.payload.specimenType === 'plantWorked'){
          return h.redirect(`${nextPathCreatedDate}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
        }

        return h.redirect(`${nextPathTradeTerm}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
      }
    }
  }

]
