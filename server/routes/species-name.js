const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, setSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { getSpecies } = require("../services/dynamics-service")
const textContent = require("../content/text-content")
const lodash = require("lodash")
const pageId = "species-name"
const currentPath = `${urlPrefix}/${pageId}`
const nextPath = `${urlPrefix}/source-code`
const invalidSubmissionPath = `${urlPrefix}/`
const unknownSpeciesPath = `${urlPrefix}/could-not-confirm`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.speciesName

  const previousPath = data.deliveryAddressOption === "different" ? `${urlPrefix}/confirm-address/delivery` : `${urlPrefix}/select-delivery-address`

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

  const model = {
    backLink: previousPath,
    pageHeader: pageContent.pageHeader,
    speciesName: data.speciesName,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    inputLabelSpeciesName: pageContent.inputLabelSpeciesName,
    bodyText: pageContent.bodyText,
    bodyLinkText: pageContent.bodyLinkText,
    bodyLinkUrl: pageContent.bodyLinkUrl,
    bodyText2: pageContent.bodyText2,
    inputSpeciesName: {
      label: {
        text: pageContent.inputLabelSpeciesName
      },
      id: "speciesName",
      name: "speciesName",
      classes: "govuk-!-width-two-thirds",
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

      if (submission.applications.length < applicationIndex) {
        console.log("Invalid application index")
        return h.redirect(invalidSubmissionPath)
      }

      if (submission.applications.length < applicationIndex + 1) {
        submission.applications.push({ applicationIndex: applicationIndex })

        try {
          mergeSubmission(request, submission)
        } catch (err) {
          console.log(err)
          return h.redirect(invalidSubmissionPath)
        }
      }

      try {
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(invalidSubmissionPath)
      }

      const pageData = {
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
            speciesName: request.payload.speciesName,
            deliveryAddressOption: submission?.delivery?.addressOption,
            applicationIndex: request.params.applicationIndex
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },

      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const speciesData = await getSpecies(
          request,
          request.payload.speciesName
        )
        const previousSubmission = getSubmission(request)
        const newSubmission = lodash.cloneDeep(previousSubmission)
        const newSubmissionApplication = newSubmission.applications[applicationIndex]
        const previousSubmissionApplication = previousSubmission.applications[applicationIndex]

        if (previousSubmission.applications.length < applicationIndex + 1) {
          return h.redirect(invalidSubmissionPath)
        }

        if (previousSubmissionApplication.species?.speciesName !== speciesData?.scientificname) {
          //TODO If changing speciesName , remove all other species data
          newSubmissionApplication.species = null
        }
        
        if(!newSubmissionApplication.species){
          newSubmissionApplication.species = {}
        }

        newSubmissionApplication.species.speciesName = speciesData?.scientificname
        newSubmissionApplication.species.speciesSearchData = request.payload.speciesName
        newSubmissionApplication.species.kingdom = speciesData?.kingdom

        try {
          setSubmission(request, newSubmission)          
        } catch (err) {
          console.log(err)
          return h.redirect(invalidSubmissionPath)
        }

        if (!speciesData?.scientificname || (speciesData.kingdom !== "Animalia" && speciesData.kingdom !== "Plantae")) {
          return h.redirect(`${unknownSpeciesPath}/${applicationIndex}`)
        }
        
        return h.redirect(`${nextPath}/${applicationIndex}`)
      }
    }
  }
]
