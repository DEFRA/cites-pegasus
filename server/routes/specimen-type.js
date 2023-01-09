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
const previousPath = `${urlPrefix}/purpose-code`
const nextPath = `${urlPrefix}/trade-term-code`
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

  const model = {
    backLink: `${previousPath}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    // captionText: captionText,

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
      items: [
        {
          value: "animalLiving",
          text: pageContent.radioOptionAnimalLiving,
          //hint: { text: pageContent.radioOptionBHint },
          // label: {
          //   classes: "govuk-!-font-weight-bold"
          // },
          checked: isChecked(data.specimenType, "animalLiving")
        },
        {
          value: "animalPart",
          text: pageContent.radioOptionAnimalPart,
          //hint: { text: pageContent.radioOptionBHint },
          // label: {
          //   classes: "govuk-!-font-weight-bold"
          // },
          checked: isChecked(data.specimenType, "animalPart")
        },
        {
          value: "animalWorked",
          text: pageContent.radioOptionAnimalWorked,
          //hint: { text: pageContent.radioOptionBHint },
          // label: {
          //   classes: "govuk-!-font-weight-bold"
          // },
          checked: isChecked(data.specimenType, "animalWorked")
        },
        {
          value: "animalCoral",
          text: pageContent.radioOptionAnimalCoral,
          //hint: { text: pageContent.radioOptionBHint },
          // label: {
          //   classes: "govuk-!-font-weight-bold"
          // },
          checked: isChecked(data.specimenType, "animalCoral")
        }
      ],
      errorMessage: getFieldError(errorList, "#specimenType")
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
        validateAppData(appData, `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        speciesName: appData.species[request.params.speciesIndex]?.speciesName,
        quantity: appData.species[request.params.speciesIndex]?.quantity,
        unitOfMeasurement: appData.species[request.params.speciesIndex]?.unitOfMeasurement,
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
          specimenType: Joi.string().required().valid('animalXLiving', 'animalPart', 'animalWorked', 'animalCoral')
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            speciesName: appData.species[request.params.speciesIndex]?.speciesName,
            quantity: appData.species[request.params.speciesIndex]?.quantity,
            unitOfMeasurement: appData.species[request.params.speciesIndex]?.unitOfMeasurement,
            specimenType: request.payload.specimenType
          }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex].specimenType = request.payload.specimenType

        try {
          mergeAppData(request, { species: appData.species }, `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
        }
        catch (err) {
          console.log(err);
          return h.redirect(`${invalidAppDataPath}/`)
        }

        return h.redirect(`${nextPath}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
      }
    }
  }

]
