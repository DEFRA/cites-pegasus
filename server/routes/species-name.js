const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../helpers/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../helpers/app-data')
const { getSpecies } = require('../services/dynamics-service')
const textContent = require('../content/text-content')
const lodash = require('lodash')
const pageId = 'species-name'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/NOT-DONE-YET`//TODO
const nextPath = `${urlPrefix}/SPECIES-NAME-VALID-NOT-DONE-YET`//TODO
const unknownSpeciesPath = `${urlPrefix}/UNKNOWN-SPECIES-NOT-DONE-YET`//TODO

function createModel(errorList, speciesName, quantity, unitOfMeasurement) {
  const commonContent = textContent.common
  const pageContent = textContent.speciesName

console.log(pageContent.unitsOfMeasurement)

  const unitsOfMeasurement = lodash.cloneDeep([{ text: pageContent.unitOfMeasurementPrompt, value: null}, ...pageContent.unitsOfMeasurement])
  unitsOfMeasurement.forEach(e => { if (e.value === unitOfMeasurement) e.selected = 'true' })

  const model = {
    backLink: previousPath,
    pageHeader: pageContent.pageHeader,
    speciesName: speciesName,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    inputLabelSpeciesName: pageContent.inputLabelSpeciesName,
    inputLabelSpeciesNameLinkText: pageContent.inputLabelSpeciesNameLinkText,
    inputLabelSpeciesNameLinkUrl: pageContent.inputLabelSpeciesNameLinkUrl,
    speciesNameError: getFieldError(errorList, '#speciesName'),
        // inputSpeciesName: {
    //   label: {
    //     text: pageContent.inputLabelSpeciesName
    //   },
    //   // hint: {
    //   //   text: pageContent.inputHintSpeciesName
    //   // },
    //   // id: "speciesName",
    //   // name: "speciesName",
    //   ...(speciesName ? { value: speciesName } : {}),
    //   //errorMessage: getFieldError(errorList, '#speciesName')
    // },
    inputQuantity: {
      label: {
        text: pageContent.inputLabelQuantity
      },
      id: "quantity",
      name: "quantity",
      classes: "govuk-input--width-4",
      ...(quantity ? { value: quantity } : {}),
      errorMessage: getFieldError(errorList, '#quantity')
    },
    selectUnitOfMeasurement: {
      label: {
        text: pageContent.selectLabelUnitOfMeasurement
      },
      id: "unitOfMeasurement",
      name: "unitOfMeasurement",
      classes: "govuk-input--width-4",
      items: unitsOfMeasurement,
      errorMessage: getFieldError(errorList, '#unitOfMeasurement')
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const appData = getAppData(request);
    // validateAppData(appData, pageId)

    return h.view(pageId, createModel(null, appData?.speciesName, appData?.quantity, appData?.unitOfMeasurement));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        speciesName: Joi.string().required(),
        quantity: Joi.number().required().min(1).max(99),
        unitOfMeasurement: Joi.string()
      }),
      failAction: (request, h, err) => {
        const errorList = []
        const fields = ['speciesName', 'quantity', 'unitOfMeasurement']
        fields.forEach(field => {
          const fieldError = findErrorList(err, [field])[0]
          if (fieldError) {
            errorList.push({
              text: fieldError,
              href: `#${field}`
            })
          }
        })

        return h.view(pageId, createModel(errorList, request.payload.speciesName, request.payload.quantity, request.payload.unitOfMeasurement)).takeover()
      }
    },
    handler: async (request, h) => {
      const species = await getSpecies(request, request.payload.speciesName)
      if (species?.scientificname){
        setAppData(request, { speciesName: species.scientificname, quantity: request.payload.quantity, unitOfMeasurement: request.payload.unitOfMeasurement });
        return h.redirect(nextPath)
      }
      return h.redirect(unknownSpeciesPath)
    }
  },
}]