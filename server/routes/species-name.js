const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
const { getSpecies } = require("../services/dynamics-service")
const textContent = require("../content/text-content")
const lodash = require("lodash")
const pageId = "species-name"
const currentPath = `${urlPrefix}/${pageId}`
const nextPath = `${urlPrefix}/source-code/0/0`
const invalidAppDataPath = urlPrefix
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
        console.log('Invalid species index')
        return h.redirect(invalidAppDataPath)
      }

      if (appData.species.length < request.params.speciesIndex + 1) {
        appData.species.push({ speciesIndex: request.params.speciesIndex, specimens: [{ specimenIndex: 0 }] })

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
        const speciesData = await getSpecies(request, request.payload.speciesName)
        const previousAppData = getAppData(request)
        const newAppData = { species: lodash.cloneDeep(previousAppData.species) }
        
        if (!newAppData.species[request.params.speciesIndex]) {
          newAppData.species.push({
            speciesIndex: request.params.speciesIndex,
            // speciesName: speciesData?.scientificname,
            // speciesSearchData: request.payload.speciesName,
            // quantity: request.payload.quantity,
            // unitOfMeasurement: request.payload.unitOfMeasurement,
            // kingdom: speciesData?.kingdom,
            specimens: [{ specimenIndex: 0 }]
          })
        }

        const newAppDataSpecies = newAppData.species[request.params.speciesIndex]
        
        newAppDataSpecies.speciesName = speciesData?.scientificname
        newAppDataSpecies.speciesSearchData = request.payload.speciesName
        newAppDataSpecies.quantity = request.payload.quantity
        newAppDataSpecies.unitOfMeasurement = request.payload.unitOfMeasurement
        newAppDataSpecies.kingdom = speciesData?.kingdom

        // const appData = {
        //   species: [
        //     {
        //       speciesIndex: 0,
        //       speciesName: speciesData?.scientificname,
        //       speciesSearchData: request.payload.speciesName,
        //       quantity: request.payload.quantity,
        //       unitOfMeasurement: request.payload.unitOfMeasurement,
        //       kingdom: speciesData?.kingdom,
        //       specimens: []
        //     }
        //   ]
        // }


        if (previousAppData?.species) {
          if (previousAppData?.species[request.params.speciesIndex]?.unitOfMeasurement === "noOfSpecimens" && request.payload.unitOfMeasurement !== "noOfSpecimens") {
            for (let i = 0; i < (previousAppData?.species[request.params.speciesIndex]?.quantity - 1); i++) {
              newAppDataSpecies.specimens.pop()
            }
          } else if (previousAppData?.species[request.params.speciesIndex]?.unitOfMeasurement === "noOfSpecimens" && previousAppData?.species[request.params.speciesIndex]?.quantity > request.payload.quantity) {
            for (let i = 0; i < previousAppData?.species[request.params.speciesIndex]?.quantity - request.payload.quantity; i++) {
              newAppDataSpecies.specimens.pop()
            }
          }
        }

        if (request.payload.unitOfMeasurement === "noOfSpecimens") {
          for (let i = 0; i < request.payload.quantity; i++) {
            if (!newAppDataSpecies.specimens[i]) {
              newAppDataSpecies.specimens.push({ specimenIndex: i })
            }
          }
        } 
        // else {
        //   if (!newAppDataSpecies.specimens[0]) {
        //     newAppDataSpecies.specimens.push({ specimenIndex: 0 })
        //   }
        // }

        try {
          mergeAppData(request, newAppData)

          if (speciesData?.scientificname) {
            return h.redirect(nextPath)
          }

          return h.redirect(`${unknownSpeciesPath}/0`)//TODO This will need to be the species index

        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }


      }
    }
  }
]

