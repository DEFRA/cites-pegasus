const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const {
  getAppData,
  setAppData,
  mergeAppData,
  validateAppData
} = require("../lib/app-data")
const { getSpecies } = require("../services/dynamics-service")
const textContent = require("../content/text-content")
const lodash = require("lodash")
const pageId = "species-name"
const currentPath = `${urlPrefix}/${pageId}`
const invalidAppDataPath = `${urlPrefix}/`
const unknownSpeciesPath = `${urlPrefix}/could-not-confirm`

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

  const previousPath =
    data.deliveryAddressOption === "different"
      ? `${urlPrefix}/confirm-address/delivery`
      : `${urlPrefix}/select-delivery-address`

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
    formActionPage: `${currentPath}/${data.speciesIndex}`,
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
    path: `${currentPath}/{speciesIndex}`,
    options: {
      validate: {
        params: Joi.object({
          speciesIndex: Joi.number().min(0).required()
        })
      }
    },
    handler: async (request, h) => {
      const appData = getAppData(request)

      if (!appData?.species) {
        appData.species = []
      }

      if (appData.species.length < request.params.speciesIndex) {
        console.log("Invalid species index")
        return h.redirect(invalidAppDataPath)
      }

      if (appData.species.length < request.params.speciesIndex + 1) {
        appData.species.push({
          speciesIndex: request.params.speciesIndex,
          specimens: [{ specimenIndex: 0 }]
        })

        try {
          mergeAppData(request, appData)
        } catch (err) {
          console.log(err)
          return h.redirect(invalidAppDataPath)
        }
      }

      try {
        validateAppData(appData, `${pageId}/${request.params.speciesIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(invalidAppDataPath)
      }

      const species = appData?.species[request.params.speciesIndex]

      const pageData = {
        speciesName: species?.speciesSearchData,
        quantity: species?.quantity,
        unitOfMeasurement: species?.unitOfMeasurement,
        deliveryAddressOption: appData?.delivery?.addressOption,
        speciesIndex: request.params.speciesIndex
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{speciesIndex}`,
    options: {
      validate: {
        options: { abortEarly: false },
        params: Joi.object({
          speciesIndex: Joi.number().min(0).required()
        }),
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
            deliveryAddressOption: appData?.delivery?.addressOption,
            speciesIndex: request.params.speciesIndex
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },

      handler: async (request, h) => {
        const speciesData = await getSpecies(
          request,
          request.payload.speciesName
        )
        const previousAppData = getAppData(request)
        const newAppData = lodash.cloneDeep(previousAppData)
        const newAppDataSpecies =
          newAppData.species[request.params.speciesIndex]
        const previousAppDataSpecies =
          previousAppData?.species[request.params.speciesIndex]

        newAppDataSpecies.speciesName = speciesData?.scientificname
        newAppDataSpecies.speciesSearchData = request.payload.speciesName
        newAppDataSpecies.quantity = request.payload.quantity
        newAppDataSpecies.unitOfMeasurement = request.payload.unitOfMeasurement
        newAppDataSpecies.kingdom = speciesData?.kingdom

         if (previousAppDataSpecies.speciesName !== request.payload.speciesName) {
          //If changing speciesName , remove all specimens
          for (let i = 0; i < previousAppDataSpecies.quantity; i++) {
            newAppDataSpecies.specimens.pop()
          }
        } else if (
          previousAppDataSpecies.unitOfMeasurement === "noOfSpecimens" &&
          request.payload.unitOfMeasurement !== "noOfSpecimens"
        ) {
          //If switching from noOfSpecimens to a measurement, remove all specimens except one
          for (let i = 0; i < previousAppDataSpecies.quantity - 1; i++) {
            newAppDataSpecies.specimens.pop()
          }
        } else if (
          previousAppDataSpecies.unitOfMeasurement === "noOfSpecimens" &&
          previousAppDataSpecies.quantity > request.payload.quantity
        ) {
          //If reducing the noOfSpecimens, remove all surplus specimens until the number equals the quantity
          for (
            let i = 0;
            i < previousAppDataSpecies.quantity - request.payload.quantity; i++) {
            newAppDataSpecies.specimens.pop()
          }
        }
        
        if (request.payload.unitOfMeasurement === "noOfSpecimens") {
          //Add new specimens to match the quantity
          for (let i = 0; i < request.payload.quantity; i++) {
            if (!newAppDataSpecies.specimens[i]) {
              newAppDataSpecies.specimens.push({ specimenIndex: i })
            }
          }
        }

        try {
          setAppData(request, newAppData)

          if (
            speciesData?.scientificname &&
            (speciesData.kingdom === "Animalia" ||
              speciesData.kingdom === "Plantae")
          ) {
            const nextPath = `${urlPrefix}/source-code/${request.params.speciesIndex}/0`
            return h.redirect(nextPath)
          }

          return h.redirect(
            `${unknownSpeciesPath}/${request.params.speciesIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(invalidAppDataPath)
        }
      }
    }
  }
]
