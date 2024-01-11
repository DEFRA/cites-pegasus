const Joi = require("joi")
const { urlPrefix, enableDeliveryType } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, setSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { getSpecies } = require("../services/dynamics-service")
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

  const model = {
    backLink: backLink,
    pageHeader: pageContent.pageHeader,
    speciesName: data.speciesName,
    containerClasses: 'hide-when-loading',
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    inputLabelSpeciesName: pageContent.inputLabelSpeciesName,
    bodyText1: pageContent.bodyText1,
    bodyText2: pageContent.bodyText2,
    bodyText3: pageContent.bodyText3,
    inputSpeciesName: {
      label: {
        text: pageContent.inputLabelSpeciesName
      },
      id: "speciesName",
      name: "speciesName",
      classes: "govuk-!-width-two-thirds",
      autocomplete: "on",
      ...(data.speciesName ? { value: data.speciesName } : {}),
      errorMessage: getFieldError(errorList, "#speciesName")
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
        applicationIndex: applicationIndex
      }

      return h.view(pageId, createModel(null, pageData))
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
            applicationIndex: request.params.applicationIndex
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },

      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const speciesData = await getSpecies(request.server, request.payload.speciesName)
        const submission = getSubmission(request)
        const application = submission.applications[applicationIndex]

        //const previousSubmission = getSubmission(request)
        // const newSubmission = lodash.cloneDeep(previousSubmission)
        // const newSubmissionApplication = newSubmission.applications[applicationIndex]
        // const previousSubmissionApplication = previousSubmission.applications[applicationIndex]

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
          species.uniqueIdentificationMarkType = null
          species.uniqueIdentificationMark = null
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
