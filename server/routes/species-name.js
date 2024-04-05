const Joi = require("joi")
const { urlPrefix, enableDeliveryType, enableSpeciesNameTypeahead } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, setSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { getSpecies, getSpecieses } = require("../services/dynamics-service")
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require("../content/text-content")
const lodash = require("lodash")
const pageId = "species-name"
const currentPath = `${urlPrefix}/${pageId}`
const nextPathSourceCode = `${urlPrefix}/source-code`
const nextPathSpeciesWarning = `${urlPrefix}/species-warning`
const invalidSubmissionPath = `${urlPrefix}/`
const unknownSpeciesPath = `${urlPrefix}/could-not-confirm`
const addApplication = `${urlPrefix}/add-application`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.speciesName

  
  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["speciesName"]
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

  const previousPathOld = (data.deliveryAddressOption === "different" ? `${urlPrefix}/confirm-address/delivery` : `${urlPrefix}/select-delivery-address`)
  const previousPath = enableDeliveryType ? `${urlPrefix}/delivery-type` : previousPathOld
  const defaultBacklink = data.applicationIndex === 0 ? previousPath : addApplication
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  let speciesResultSelectItems
  if (data.speciesSearchResults && data.speciesSearchResults.count > 0) {
    speciesResultSelectItems = data.speciesSearchResults.items.map(item => ({ text: item.scientificName, value: item.scientificName }))
    speciesResultSelectItems.unshift({ text: 'Please select', value: null });
  }

  const errorMessage = getFieldError(errorList, "#speciesName")

  const model = {
    backLink: backLink,
    pageHeader: pageContent.pageHeader,
    speciesName: data.speciesName,
    containerClasses: 'hide-when-loading',
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    formActionSearch: `${currentPath}/search/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    inputLabelSpeciesName: pageContent.inputLabelSpeciesName,
    javascriptBody: pageContent.javascriptBody,
    noJavascriptBody: pageContent.noJavascriptBody,    
    speciesSearchResults: data.speciesSearchResults,
    speciesSearchResultsCount: data.speciesSearchResults?.count,
    //selectSpecies,
    errorMessage: errorMessage?.text,
    enableSpeciesNameTypeahead,
    inputSpeciesName: {
      id: "speciesName",
      name: "speciesName",
      classes: "govuk-!-width-two-thirds",
      autocomplete: "on",
      ...(data.speciesName ? { value: data.speciesName } : {}),
      errorMessage
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
          applicationIndex: Joi.number().min(0).required()
        })
      }
    },
    handler: async (request, h) => {
      const { applicationIndex } = request.params
      const submission = getSubmission(request)

      if (!submission?.applications) {
        submission.applications = []
      }

      if(applicationIndex + 1 > submission.applications.length) {
        console.log("Invalid application index")
        return h.redirect(invalidSubmissionPath)
      }


      try {
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        speciesName: submission.applications[applicationIndex].species?.speciesSearchData,
        deliveryAddressOption: submission.delivery.addressOption,
        applicationIndex: applicationIndex,
        speciesSearchResults: null
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "GET",
    path: `${currentPath}/search/{query}`,
    options: {
      validate: {
        params: Joi.object({
          query: Joi.string()
        })
      }
    },
    handler: async (request, h) => {
      if(request.params.query.length < 3) {
        return ''
      }
      const speciesSearchResults = await getSpecieses(request.server, request.params.query)

      return h.response(speciesSearchResults.items.map(item => item.scientificName))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        options: { abortEarly: false },
        params: Joi.object({
          applicationIndex: Joi.number().min(0).required()
        }),
        payload: Joi.object({
          speciesName: Joi.string().required()
        }),
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            speciesName: request.payload.speciesName,
            deliveryAddressOption: submission?.delivery?.addressOption,
            applicationIndex: request.params.applicationIndex,
            speciesSearchResults: null
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },

      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const speciesData = await getSpecies(request.server, request.payload.speciesName)
        const submission = getSubmission(request)
        const application = submission.applications[applicationIndex]

        if (submission.applications.length < applicationIndex + 1) {
          return h.redirect(invalidSubmissionPath)
        }

        const isMajorChange = application.species && application.species?.kingdom !== speciesData?.kingdom //Change from plant to animal or vice versa is major, change within kingdom is minor

        if (!application.species) {
          application.species = {}
        }

        const species = application.species

        species.speciesName = speciesData?.scientificName
        species.speciesSearchData = request.payload.speciesName
        species.kingdom = speciesData?.kingdom
        species.hasRestriction =  speciesData?.hasRestriction 
        species.warningMessage = speciesData?.warningMessage

        if (isMajorChange) {
          //If changing kingdom, remove all other species data as far as the specimen description pages
          species.sourceCode = null
          species.anotherSourceCodeForI = null
          species.anotherSourceCodeForO = null
          species.enterAReason = null
          species.purposeCode = null
          species.useCertificateFor = null
          species.specimenType = null
          species.specimenOrigin = null
          species.quantity = null
          species.unitOfMeasurement = null
          species.createdDate = null
          species.isTradeTermCode = null
          species.tradeTermCode = null
          species.tradeTermCodeDesc = null
          species.hasUniqueIdentificationMark = null //TODO Make sure this is also cleared in other scenarios that remove the unique ID details
          species.uniqueIdentificationMarks = null //TODO Make sure this is also cleared in other scenarios that remove the unique ID details
          //species.uniqueIdentificationMarkType = null
          //species.uniqueIdentificationMark = null //TODO Update this to also clear out the saved unique IDs from the new data structure and in other scenarios
          //species.numberOfUniqueIdentificationMarks = null //TODO Make sure this is also cleared in other scenarios that remove the unique ID details
          species.isMultipleSpecimens = null
          species.numberOfUnmarkedSpecimens = null
          species.specimenDescriptionLivingAnimal = null
          species.specimenDescriptionGeneric = null
          species.maleParentDetails = null
          species.femaleParentDetails = null
          species.sex = null
          species.dateOfBirth = null
          application.isBreeder = null
        }

        try {
          setSubmission(request, submission)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        if (isMajorChange) {
          setDataRemoved(request)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false, !isMajorChange)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        let redirectTo = `${nextPathSourceCode}/${applicationIndex}`
        if (!speciesData?.scientificName || (speciesData.kingdom !== "Animalia" && speciesData.kingdom !== "Plantae")) {
          redirectTo = `${unknownSpeciesPath}/${applicationIndex}`
        } else if (species.hasRestriction) {
          redirectTo = `${nextPathSpeciesWarning}/${applicationIndex}`
        }
        
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)    
      }
    }
  }
]
