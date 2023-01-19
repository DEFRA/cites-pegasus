const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const pageId = "describe-specimen"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/unique-identification-mark`
const nextPathImporterDetails = `${urlPrefix}/importer-exporter-details` //TO DO
const nextPathArticle10 = `${urlPrefix}/acquired-date` //TO DO
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.specimenDescriptionGeneric

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["specimenDescriptionGeneric"]
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
  const specimenIndex = data.specimenIndex + 1
  const unitOfMeasurement = data.unitOfMeasurement

  const captionText =
    unitOfMeasurement === "noOfSpecimens"
      ? `${speciesName} (${specimenIndex} of ${quantity})`
      : `${speciesName}`

  const model = {
    backLink: `${previousPath}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : `${pageContent.defaultTitle} ${speciesName}`,
    captionText: captionText,

    inputSpecimenDescriptionGeneric: {
      id: "specimenDescriptionGeneric",
      name: "specimenDescriptionGeneric",
      maxlength: 448,
      classes: "govuk-textarea govuk-js-character-count",
      label: {
        text: `${pageContent.pageHeader} ${speciesName}`,
        isPageHeading: true,
        classes: "govuk-label--l"
      },
      ...(data.specimenDescriptionGeneric ? { value: data.specimenDescriptionGeneric } : {}),
      errorMessage: getFieldError(errorList, "#specimenDescriptionGeneric")
    }
  }
  return { ...commonContent, ...model }
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
        validateAppData(
          appData,
          `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
        )
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        speciesName: appData.species[request.params.speciesIndex]?.speciesName,
        quantity: appData.species[request.params.speciesIndex]?.quantity,
        unitOfMeasurement:
          appData.species[request.params.speciesIndex]?.unitOfMeasurement,
       specimenDescriptionGeneric:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.specimenDescriptionGeneric
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
           specimenDescriptionGeneric: Joi.string().min(5).max(449).regex(COMMENTS_REGEX).required()
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            speciesName: appData.species[request.params.speciesIndex]?.speciesName,
            quantity: appData.species[request.params.speciesIndex]?.quantity,
            unitOfMeasurement: appData.species[request.params.speciesIndex]?.unitOfMeasurement,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex].specimenDescriptionGeneric = request.payload.specimenDescriptionGeneric

        try {
            mergeAppData(
              request,
              { species: appData.species },
              `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
            )
          } catch (err) {
            console.log(err)
            return h.redirect(`${invalidAppDataPath}/`)
          }
  

          if (appData.permitType === "article10"){
            return h.redirect(
              `${nextPathArticle10}/${request.params.speciesIndex}/${request.params.specimenIndex}`
            )
          } else {
             return h.redirect(
            `${nextPathImporterDetails}/${request.params.speciesIndex}/${request.params.specimenIndex}`
          )
          }
      }
    }
  }
]
