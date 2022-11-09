const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../helpers/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../helpers/app-data')
const { getSpecies } = require('../services/dynamics-service')
const textContent = require('../content/text-content')
const pageId = 'species-name'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/`//TODO
const nextPath = `${urlPrefix}/`//TODO

function createModel(errorList, speciesName) {
  const commonContent = textContent.common;
  const pageContent = textContent.speciesName;

  const model = {
    backLink: previousPath,
    pageHeader: pageContent.pageHeader,
    speciesName: speciesName,
    formActionPage: currentPath,
    //formActionSearch: `${currentPath}/search`,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    inputSpeciesName: {
      label: {
        text: pageContent.inputLabelSpeciesName
      },
      id: "speciesName",
      name: "speciesName",
      classes: "govuk-!-width-two-thirds",
      ...(speciesName ? { value: speciesName } : {}),
      errorMessage: getFieldError(errorList, '#speciesName')
    },
    inputQuantity: {
      label: {
        text: 'quantity'
      },
      id: "quantity",
      name: "quantity",
      classes: "govuk-!-width-two-thirds",
      //...(quantity ? { value: quantity } : {}),
      errorMessage: getFieldError(errorList, '#quantity')
    },
    inputUnitOfMeasure: {
      label: {
        text: 'unit of measure'
      },
      id: "unitOfMeasure",
      name: "unitOfMeasure",
      classes: "govuk-!-width-two-thirds",
      //...(unitOfMeasure ? { value: unitOfMeasure } : {}),
      errorMessage: getFieldError(errorList, '#unitOfMeasure')
    },
    //searchResults: searchResult?.scientificname ? searchResult?.scientificname : 'no results'
  }
  return { ...commonContent, ...model }
}

function validateScientificName(value, helpers) {
  if (value === 'ant') {
    return value
  } else {
    return helpers.error("any.invalid")
  }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    // const appData = getAppData(request);
    // validateAppData(appData, pageId)

    return h.view(pageId, createModel(null, null));
  }
},
// {
//   method: 'POST',
//   path: `${currentPath}/search`,
//   options: {
//     validate: {
//       options: { abortEarly: false },
//       payload: Joi.object({
//         speciesName: Joi.string().required(),
//         quantity: Joi.string().required(),
//         unitOfMeasure: Joi.string().required()
//       }),
//       failAction: (request, h, err) => {
//         const errorList = []
//         const fields = ['speciesName', 'quantity', 'unitOfMeasure']
//         fields.forEach(field => {
//           const fieldError = findErrorList(err, [field])[0]
//           if (fieldError) {
//             errorList.push({
//               text: fieldError,
//               href: `#${field}`
//             })
//           }
//         })
//         console.log('Error Searching')

//         return h.view(pageId, createModel(errorList, request.payload.speciesName, null)).takeover()
//       }
//     },
//     handler: async (request, h) => {
//       console.log('Searching')

//       const result = await getSpecies(request.payload.speciesName)

//       return h.view(pageId, createModel(null, request.payload.speciesName, result));

//       //return request.payload.permitType === 'other' ? h.redirect(cannotUseServicePath) : h.redirect(nextPath);
//     }
//   },
// },
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        speciesName: Joi.string().required().custom(validateScientificName),
        quantity: Joi.string().allow(null, ''),
        unitOfMeasure: Joi.string().allow(null, '')
      }),
      failAction: (request, h, err) => {
        const errorList = []
        const fields = ['speciesName', 'quantity', 'unitOfMeasure']
        fields.forEach(field => {
          const fieldError = findErrorList(err, [field])[0]
          if (fieldError) {
            errorList.push({
              text: fieldError,
              href: `#${field}`
            })
          }
        })

        console.log('Error Continuing')
        return h.view(pageId, createModel(errorList, request.payload.speciesName)).takeover()
      }
    },
    handler: async (request, h) => {
      console.log('Continuing')
      //setAppData(request, { speciesName: request.payload.speciesName });

      return h.view(pageId, createModel(null, request.payload.speciesName)).takeover()
      //return request.payload.permitType === 'other' ? h.redirect(cannotUseServicePath) : h.redirect(nextPath);
    }
  },
}]