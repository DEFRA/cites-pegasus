const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, setAppData, validateAppData } = require("../lib/app-data")
const { setYarValue } = require("../lib/session")
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

      const speciesName =  appData.species ? appData?.species[0]?.speciesName : ""
      const quantity = appData.species ? appData?.species[0]?.quantity : ""
      const unitOfMeasurement = appData.species ? appData?.species[0]?.unitOfMeasurement : ""


      const pageData = {
        speciesName:  speciesName,
        quantity: quantity,
        unitOfMeasurement: unitOfMeasurement,
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
        const speciesData = await getSpecies(request, request.payload.speciesName)

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


        const previousAppData = getAppData(request)

        if (previousAppData?.species) {
          if (previousAppData?.species[0]?.unitOfMeasurement === "noOfSpecimens" && request.payload.unitOfMeasurement !== "noOfSpecimens"){
            for (let i = 0; i < (previousAppData?.species[0]?.quantity - 1); i++) {
              previousAppData.species[0].specimens.pop()
            }
          } else if (previousAppData?.species[0]?.unitOfMeasurement === "noOfSpecimens" && previousAppData?.species[0]?.quantity > request.payload.quantity){
            for (let i = 0; i < previousAppData?.species[0]?.quantity - request.payload.quantity; i++) {
              previousAppData.species[0].specimens.pop()
            }
          } 
        }


        if (request.payload.unitOfMeasurement === "noOfSpecimens") {
          for (let i = 0; i < request.payload.quantity; i++) {
            appData.species[0].specimens.push({ specimenIndex: i })
          }
        } else {
          appData.species[0].specimens.push({ specimenIndex: 0 })
        }

        try {
          if (speciesData?.scientificname) {
            setYarValue(request, 'unknownSpeciesName', null)
            setAppData(request, appData)
            return h.redirect(nextPath)
          } else {
            setYarValue(request, 'unknownSpeciesName', request.payload.speciesName)
            return h.redirect(unknownSpeciesPath)
          }       
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }

        
      }
    }
  }
]

