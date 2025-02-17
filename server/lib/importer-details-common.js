const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('./submission')
const { getFieldError, getCountries } = require('./helper-functions')
const { stringLength } = require('./constants')
const { NAME_REGEX } = require('./regex-validation')
const { checkChangeRouteExit } = require('./change-route')
const { permitType: pt } = require('./permit-type-helper')
const invalidSubmissionPath = `${urlPrefix}/`
const viewName = 'importer-exporter'

function getInputs (pageContent, data, errorList) {
  return {
    selectCountry: {
      label: {
        text: pageContent.inputLabelCountry
      },
      id: 'country',
      name: 'country',
      classes: 'govuk-!-width-two-thirds',
      items: getCountries(data.countries, data.country),
      errorMessage: getFieldError(errorList, '#country')
    },
    inputFullName: {
      label: {
        text: pageContent.inputLabelFullName
      },
      id: 'name',
      name: 'name',
      autocomplete: 'name',
      ...(data.name ? { value: data.name } : {}),
      errorMessage: getFieldError(errorList, '#name')
    },
    inputAddressLine1: {
      label: {
        text: pageContent.inputLabelAddressLine1
      },
      id: 'addressLine1',
      name: 'addressLine1',
      autocomplete: 'address-line1',
      ...(data.addressLine1 ? { value: data.addressLine1 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine1')
    },
    inputAddressLine2: {
      label: {
        text: pageContent.inputLabelAddressLine2
      },
      id: 'addressLine2',
      name: 'addressLine2',
      autocomplete: 'address-line2',
      ...(data.addressLine2 ? { value: data.addressLine2 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine2')
    },
    inputAddressLine3: {
      label: {
        text: pageContent.inputLabelAddressLine3
      },
      id: 'addressLine3',
      name: 'addressLine3',
      autocomplete: 'address-line3',
      ...(data.addressLine3 ? { value: data.addressLine3 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine3')
    },
    inputAddressLine4: {
      label: {
        text: pageContent.inputLabelAddressLine4
      },
      id: 'addressLine4',
      name: 'addressLine4',
      autocomplete: 'address-line4',
      ...(data.addressLine4 ? { value: data.addressLine4 } : {}),
      errorMessage: getFieldError(errorList, '#addressLine4')
    },
    inputPostcode: {
      label: {
        text: pageContent.inputLabelPostcode
      },
      id: 'postcode',
      name: 'postcode',
      classes: 'govuk-!-width-one-third',
      autocomplete: 'postal-code',
      ...(data.postcode ? { value: data.postcode } : {}),
      errorMessage: getFieldError(errorList, '#postcode')
    }
  }
}

function createGetHandler (pageId, path, createModel, getImporterExporterDetails) {
  const getHandler = {
    method: 'GET',
    path: path,
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
      const importerExporterDetails = getImporterExporterDetails(submission, applicationIndex)
      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        sex: submission.applications[applicationIndex].species.sex,
        country: importerExporterDetails?.country,
        name: importerExporterDetails?.name,
        addressLine1: importerExporterDetails?.addressLine1,
        addressLine2: importerExporterDetails?.addressLine2,
        addressLine3: importerExporterDetails?.addressLine3,
        addressLine4: importerExporterDetails?.addressLine4,
        postcode: importerExporterDetails?.postcode,
        countries: request.server.app.countries
      }

      return h.view(viewName, createModel(null, pageData))
    }
  }
  return getHandler
}

function createPostHandler (pageId, path, createModel, getRedirect) {
  return {
    method: 'POST',
    path: path,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          country: Joi.string().max(stringLength.max150).required(),
          name: Joi.string().max(stringLength.max150).regex(NAME_REGEX).required(),
          addressLine1: Joi.string().max(stringLength.max150).required(),
          addressLine2: Joi.string().max(stringLength.max150).required(),
          addressLine3: Joi.string().max(stringLength.max150).optional().allow('', null),
          addressLine4: Joi.string().max(stringLength.max150).optional().allow('', null),
          postcode: Joi.string().max(stringLength.max50).optional().allow('', null)
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
            countries: request.server.app.countries
          }
          return h.view(viewName, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)

        const selectedCountry = request.server.app.countries.find(country => country.code === (request.payload.country || 'UK'))

        const details = {
          country: selectedCountry.code,
          countryDesc: selectedCountry.name,
          name: request.payload.name.trim(),
          addressLine1: request.payload.addressLine1.trim(),
          addressLine2: request.payload.addressLine2.trim(),
          addressLine3: request.payload.addressLine3.trim(),
          addressLine4: request.payload.addressLine4.trim(),
          postcode: request.payload.postcode.trim()
        }

        if (submission.permitType === pt.ARTICLE_10) {
          submission.applications[applicationIndex].a10ExportData.importerDetails = details
        } else {
          submission.applications[applicationIndex].importerExporterDetails = details
        }

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        const redirectTo = getRedirect(applicationIndex, submission.permitType)

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
}

module.exports = { createGetHandler, createPostHandler, getInputs }
