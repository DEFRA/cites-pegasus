const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { NAME_REGEX } = require('../lib/regex-validation')
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'importer-exporter'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const nextPathPermitDetails = `${urlPrefix}/permit-details`
const nextPathComments = `${urlPrefix}/comments`
const lodash = require('lodash')
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {

  const commonContent = textContent.common

  let pageContent = null

  const importerExporterText = lodash.cloneDeep(textContent.importerExporter) //Need to clone the source of the text content so that the merge below doesn't affect other pages.

  if (data.permitType === 'import') {
    pageContent = lodash.merge(importerExporterText.common, importerExporterText.exporterDetails)
  } else {
    pageContent = lodash.merge(importerExporterText.common, importerExporterText.importerDetails)
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

  const countries = [{
    text: commonContent.countrySelectDefault,
    value: '',
    selected: false
  }]

  countries.push(...data.countries.map(country => {
    return {
      text: country.name,
      value: country.code,
      selected: country.code === (data.country || '')
    }
  }))

  const previousPath = data.sex ? previousPathDescribeLivingAnimal : previousPathDescribeSpecimen

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    heading: pageContent.heading,
    headingAddress: pageContent.headingAddress,
    selectCountry: {
      label: {
        text: pageContent.inputLabelCountry
      },
      id: "country",
      name: "country",
      classes: "govuk-!-width-two-thirds",
      items: countries,
      errorMessage: getFieldError(errorList, '#country')
    },
    inputFullName: {
      label: {
        text: pageContent.inputLabelFullName
      },
      id: "name",
      name: "name",
      autocomplete: "name",
      ...(data.name ? { value: data.name } : {}),
      errorMessage: getFieldError(errorList, '#name')
    },
    inputAddressLine1: {
      label: {
        text: pageContent.inputLabelAddressLine1
      },
      id: "addressLine1",
      name: "addressLine1",
      autocomplete: "address-line1",
      ...(data.addressLine1 ? { value: data.addressLine1 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine1')
    },
    inputAddressLine2: {
      label: {
        text: pageContent.inputLabelAddressLine2
      },
      id: "addressLine2",
      name: "addressLine2",
      autocomplete: "address-line2",
      ...(data.addressLine2 ? { value: data.addressLine2 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine2')
    },
    inputAddressLine3: {
      label: {
        text: pageContent.inputLabelAddressLine3
      },
      id: "addressLine3",
      name: "addressLine3",
      autocomplete: "address-line3",
      ...(data.addressLine3 ? { value: data.addressLine3 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine3')
    },
    inputAddressLine4: {
      label: {
        text: pageContent.inputLabelAddressLine4
      },
      id: "addressLine4",
      name: "addressLine4",
      autocomplete: "address-line4",
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
      autocomplete: "postal-code",
      ...(data.postcode ? { value: data.postcode } : {}),
      errorMessage: getFieldError(errorList, '#postcode')
    }

  }
  return { ...commonContent, ...model }
}



module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const { applicationIndex } = request.params
      const submission = getSubmission(request)

      try {
        validateSubmission(submission, `${pageId}/${request.params.applicationIndex}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const importerExporter = submission.applications[applicationIndex].importerExporterDetails

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        sex: submission.applications[applicationIndex].species.sex,
        country: importerExporter?.country,
        name: importerExporter?.name,
        addressLine1: importerExporter?.addressLine1,
        addressLine2: importerExporter?.addressLine2,
        addressLine3: importerExporter?.addressLine3,
        addressLine4: importerExporter?.addressLine4,
        postcode: importerExporter?.postcode,
        countries: request.server.app.countries,
      }

      return h.view(pageId, createModel(null, pageData))

    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
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
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            sex: submission.applications[applicationIndex].species.sex,
            ...request.payload,
            countries: request.server.app.countries,
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)

        const selectedCountry = request.server.app.countries.find(country => country.code === (request.payload.country || 'UK'))


        const importerExporterDetails = {
          country: selectedCountry.code,
          countryDesc: selectedCountry.name,
          name: request.payload.name.trim(),
          addressLine1: request.payload.addressLine1.trim(),
          addressLine2: request.payload.addressLine2.trim(),
          addressLine3: request.payload.addressLine3.trim(),
          addressLine4: request.payload.addressLine4.trim(),
          postcode: request.payload.postcode.trim()
        }

        submission.applications[applicationIndex].importerExporterDetails = importerExporterDetails

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        const redirectTo = submission.permitType === 'export' ? `${nextPathComments}/${applicationIndex}` : `${nextPathPermitDetails}/${applicationIndex}`

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)

      }
    }
  }
]
