const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, setAppData, validateAppData } = require("../lib/app-data")
const { getSpecies } = require("../services/dynamics-service")
const textContent = require("../content/text-content")
const lodash = require("lodash")
const pageId = "species-name"
const currentPath = `${urlPrefix}/${pageId}`
const nextPath = `${urlPrefix}/source-code/0/0`
const unknownSpeciesPath = `${urlPrefix}/UNKNOWN-SPECIES-NOT-DONE-YET` //TODO
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.speciesName

  const unitsOfMeasurement = lodash.cloneDeep([
    { text: pageContent.unitOfMeasurementPrompt, value: null },
    ...pageContent.unitsOfMeasurement
  ])
  unitsOfMeasurement.forEach((e) => {
    if (e.value === data.unitOfMeasurement) e.selected = "true"
  })

  const previousPath = data.deliveryAddressOption === 'different' ? `${urlPrefix}/confirm-address/delivery` : `${urlPrefix}/select-delivery-address`

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["speciesName", "quantity", "unitOfMeasurement"]
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

  const model = {
    backLink: previousPath,
    pageHeader: pageContent.pageHeader,
    speciesName: data.speciesName,
    formActionPage: currentPath,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    inputLabelSpeciesName: pageContent.inputLabelSpeciesName,
    bodyText: pageContent.bodyText,
    bodyLinkText: pageContent.bodyLinkText,
    bodyLinkUrl: pageContent.bodyLinkUrl,
    speciesNameError: getFieldError(errorList, "#speciesName"),
    inputSpeciesName: {
      label: {
        text: pageContent.inputLabelSpeciesName
      },
      id: "speciesName",
      name: "speciesName",
      classes: "govuk-!-width-two-thirds",
      ...(data.speciesName ? { value: data.speciesName } : {}),
      errorMessage: getFieldError(errorList, "#speciesName")
    },
    inputQuantity: {
      label: {
        text: pageContent.inputLabelQuantity
      },
      id: "quantity",
      name: "quantity",
      classes: "govuk-input--width-4",
      ...(data.quantity ? { value: data.quantity } : {}),
      errorMessage: getFieldError(errorList, "#quantity")
    },
    selectUnitOfMeasurement: {
      label: {
        text: pageContent.selectLabelUnitOfMeasurement
      },
      id: "unitOfMeasurement",
      name: "unitOfMeasurement",
      items: unitsOfMeasurement,
      errorMessage: getFieldError(errorList, "#unitOfMeasurement")
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [
  {
    method: "GET",
    path: currentPath,
    handler: async (request, h) => {
      const appData = getAppData(request)

      try {
        validateAppData(appData, `${pageId}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const pageData = {
        speciesName: appData?.speciesName,
        quantity: appData?.quantity,
        unitOfMeasurement: appData?.unitOfMeasurement,
        deliveryAddressOption: appData?.delivery?.addressOption
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "POST",
    path: currentPath,
    options: {
      validate: {
        options: { abortEarly: false },
        payload: Joi.object({
          speciesName: Joi.string().required(),
          quantity: Joi.number().required().min(0.0001).max(1000000),
          unitOfMeasurement: Joi.string()
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            speciesName: request.payload.speciesName,
            quantity: request.payload.quantity,
            unitOfMeasurement: request.payload.unitOfMeasurement,
            deliveryAddressOption: appData?.delivery?.addressOption
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },

      handler: async (request, h) => {
        const speciesData = await getSpecies(
          request,
          request.payload.speciesName
        )

        const appData = {
          species: [
            {
              speciesIndex: 0,
              speciesName: speciesData?.scientificname,
              quantity: request.payload.quantity,
              unitOfMeasurement: request.payload.unitOfMeasurement,
              kingdom: speciesData?.kingdom,
              specimens: []
            }
          ]
        }

        if (request.payload.unitOfMeasurement === "noOfSpecimens") {
          for (let i = 0; i < request.payload.quantity; i++) {
            appData.species[0].specimens.push({ specimenIndex: i })
          }
        }



        try {
          setAppData(request, appData, `${pageId}`)
      }
      catch (err) {
          console.log(err);
          return h.redirect(`${invalidAppDataPath}/`)
      }

        if (speciesData?.scientificname) {
          setAppData(request, appData)
          return h.redirect(nextPath)
        }
        return h.redirect(unknownSpeciesPath)
      }
    }
  }
]
