const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { NAME_REGEX } = require('../lib/regex-validation')
const { permitType: pt } = require('../lib/permit-type-helper')
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'importer-details'
const viewName = 'importer-exporter'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathAddExportPermit = `${urlPrefix}/add-export-permit`
const nextPathAppSummary = `${urlPrefix}/application-summary/check`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {

  const { common: commonContent, importerDetails: pageContent } = textContent
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["country", "name", "addressLine1", "addressLine2", "addressLine3", "addressLine4", "postcode"])
 
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

  const defaultBacklink = `${previousPathAddExportPermit}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text  + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    heading: pageContent.heading,
    headingAddress: pageContent.headingAddress,
    insetText: { 
      text: pageContent.insetText
    },
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

      const importerDetails = submission.applications[applicationIndex].a10ExportData?.importerDetails

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        country: importerDetails?.country,
        name: importerDetails?.name,
        addressLine1: importerDetails?.addressLine1,
        addressLine2: importerDetails?.addressLine2,
        addressLine3: importerDetails?.addressLine3,
        addressLine4: importerDetails?.addressLine4,
        postcode: importerDetails?.postcode,
        countries: request.server.app.countries,
      }

      return h.view(viewName, createModel(null, pageData))//This view is shared with the importer-exporter page

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

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            ...request.payload,
            countries: request.server.app.countries,
          }
          return h.view(viewName, createModel(err, pageData)).takeover()//This view is shared with the importer-exporter page
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)

        const selectedCountry = request.server.app.countries.find(country => country.code === (request.payload.country || 'UK'))


        const importerDetails = {
          country: selectedCountry.code,
          countryDesc: selectedCountry.name,
          name: request.payload.name.trim(),
          addressLine1: request.payload.addressLine1.trim(),
          addressLine2: request.payload.addressLine2.trim(),
          addressLine3: request.payload.addressLine3.trim(),
          addressLine4: request.payload.addressLine4.trim(),
          postcode: request.payload.postcode.trim()
        }

        submission.applications[applicationIndex].a10ExportData.importerDetails = importerDetails

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

        const redirectTo = `${nextPathAppSummary}/${applicationIndex}`

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)

      }
    }
  }
]
