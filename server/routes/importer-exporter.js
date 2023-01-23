const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getAppData, mergeAppData, validateAppData } = require('../lib/app-data')
const { NAME_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'importer-exporter'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const nextPathPermitDetails = `${urlPrefix}/permit-details`
const nextPathRemarks = `${urlPrefix}/remarks`

const invalidAppDataPath = urlPrefix

function createModel(errors, data) {

  const commonContent = textContent.common
  const pageContent = textContent.importerExporter

  let defaultTitle = ''
  let pageHeader = ''
  let heading = ''

  switch (data.permitType) {
    case 'import':
      defaultTitle = pageContent.defaultTitleImport
      pageHeader = pageContent.pageHeaderImport
      heading = pageContent.headingImport
      break;
    default:
      defaultTitle = pageContent.defaultTitleNonImport
      pageHeader = pageContent.pageHeaderNonImport
      heading = pageContent.headingNonImport
      break;
  }

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["country", "name", "addressLine1", "addressLine2", "addressLine3", "addressLine4", "postcode"]
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
    backLink: `${previousPathDescribeLivingAnimal}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : defaultTitle,
    pageHeader: pageHeader,
    heading: heading,
    headingAddress: pageContent.headingAddress,
    inputCountry: {
      label: {
        text: pageContent.inputLabelCountry
      },
      id: "country",
      name: "country",
      classes: "govuk-!-width-two-thirds",
      ...(data.country ? { value: data.country } : {}),
      errorMessage: getFieldError(errorList, '#country')
    },
    inputFullName: {
      label: {
        text: pageContent.inputLabelFullName
      },
      id: "name",
      name: "name",
      ...(data.name ? { value: data.name } : {}),
      errorMessage: getFieldError(errorList, '#name')
    },
    inputAddressLine1: {
      label: {
        text: pageContent.inputLabelAddressLine1
      },
      id: "addressLine1",
      name: "addressLine1",
      ...(data.addressLine1 ? { value: data.addressLine1 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine1')
    },
    inputAddressLine2: {
      label: {
        text: pageContent.inputLabelAddressLine2
      },
      id: "addressLine2",
      name: "addressLine2",
      ...(data.addressLine2 ? { value: data.addressLine2 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine2')
    },
    inputAddressLine3: {
      label: {
        text: pageContent.inputLabelAddressLine3
      },
      id: "addressLine3",
      name: "addressLine3",
      ...(data.addressLine3 ? { value: data.addressLine3 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine3')
    },
    inputAddressLine4: {
      label: {
        text: pageContent.inputLabelAddressLine4
      },
      id: "addressLine4",
      name: "addressLine4",
      ...(data.addressLine4 ? { value: data.addressLine4 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine4')
    },
    inputPostcode: {
      label: {
        text: pageContent.inputLabelPostcode
      },
      id: "postcode",
      name: "postcode",
      classes: "govuk-!-width-one-third",
      ...(data.postcode ? { value: data.postcode } : {}),
      errorMessage: getFieldError(errorList, '#postcode')
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

      const importerExporter = appData.species[request.params.speciesIndex].importerExporterDetails

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        permitType: appData.permitType,
        country: importerExporter?.country,
        name: importerExporter?.name,
        addressLine1: importerExporter?.addressLine1,
        addressLine2: importerExporter?.addressLine2,
        addressLine3: importerExporter?.addressLine3,
        addressLine4: importerExporter?.addressLine4,
        postcode: importerExporter?.postcode
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
          country: Joi.string().max(150).required(),
          name: Joi.string().max(150).regex(NAME_REGEX).required(),
          addressLine1: Joi.string().max(150).required(),
          addressLine2: Joi.string().max(150).required(),
          addressLine3: Joi.string().max(150).optional().allow('', null),
          addressLine4: Joi.string().max(150).optional().allow('', null),
          postcode: Joi.string().max(50).optional().allow('', null)
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            permitType: appData.permitType,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        const importerExporterDetails = {
          country: request.payload.country.trim(),
          name: request.payload.name.trim(),
          addressLine1: request.payload.addressLine1.trim(),
          addressLine2: request.payload.addressLine2.trim(),
          addressLine3: request.payload.addressLine3.trim(),
          addressLine4: request.payload.addressLine4.trim(),
          postcode: request.payload.postcode.trim()
        }

        appData.species[request.params.speciesIndex].importerExporterDetails = importerExporterDetails        

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

        if (appData.permitType === 'export') {
          return h.redirect(`${nextPathRemarks}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
        } else {
          return h.redirect(`${nextPathPermitDetails}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
        }
      }
    }
  }
]
