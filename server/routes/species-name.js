const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../lib/app-data')
const { getSpecies } = require('../services/dynamics-service')
const textContent = require('../content/text-content')
const lodash = require('lodash')
const pageId = 'species-name'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/confirm-address/applicant`//TODO
const nextPath = `${urlPrefix}/purpose-code/1/1`
const unknownSpeciesPath = `${urlPrefix}/UNKNOWN-SPECIES-NOT-DONE-YET`//TODO

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.speciesName

  const unitsOfMeasurement = lodash.cloneDeep([{ text: pageContent.unitOfMeasurementPrompt, value: null}, ...pageContent.unitsOfMeasurement])
  unitsOfMeasurement.forEach(e => { if (e.value === data.unitOfMeasurement) e.selected = 'true' })

  let errorList = null
    if(errors){
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
        const fields = ['speciesName', 'quantity', 'unitOfMeasurement']
        fields.forEach(field => {
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
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    inputLabelSpeciesName: pageContent.inputLabelSpeciesName,
    bodyText: pageContent.bodyText,
    bodyLinkText: pageContent.bodyLinkText,
    bodyLinkUrl: pageContent.bodyLinkUrl,
    speciesNameError: getFieldError(errorList, '#speciesName'),
    inputSpeciesName: {
      label: {
        text: pageContent.inputLabelSpeciesName
      },
      // hint: {
      //    text: pageContent.inputHintSpeciesName
      // },
      id: "speciesName",
      name: "speciesName",
      classes: "govuk-!-width-two-thirds",
      ...(data.speciesName ? { value: data.speciesName } : {}),
      errorMessage: getFieldError(errorList, '#speciesName')
    },
    inputQuantity: {
      label: {
        text: pageContent.inputLabelQuantity
      },
      id: "quantity",
      name: "quantity",
      classes: "govuk-input--width-4",
      ...(data.quantity ? { value: data.quantity } : {}),
      errorMessage: getFieldError(errorList, '#quantity')
    },
    selectUnitOfMeasurement: {
      label: {
        text: pageContent.selectLabelUnitOfMeasurement
      },
      id: "unitOfMeasurement",
      name: "unitOfMeasurement",
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
    // validateAppData(appData, pageId) //TODO
    const pageData = { 
      speciesName: appData?.speciesName, 
      quantity: appData?.quantity, 
      unitOfMeasurement: appData?.unitOfMeasurement
    }

    return h.view(pageId, createModel(null, pageData));
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
        quantity: Joi.number().required().min(0.0001).max(1000000),
        unitOfMeasurement: Joi.string()
      }),
      failAction: (request, h, err) => {        
        const pageData = { 
          speciesName: request.payload.speciesName, 
          quantity: request.payload.quantity, 
          unitOfMeasurement: request.payload.unitOfMeasurement
        }
        return h.view(pageId, createModel(err, pageData)).takeover()
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