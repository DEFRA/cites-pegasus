const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const pageId = "describe-specimen"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathUniqueId = `${urlPrefix}/unique-identification-mark`
const previousPathUnmarkedSpecimens = `${urlPrefix}/unmarked-specimens`
const nextPathImporterDetails = `${urlPrefix}/importer-exporter`
const nextPathArticle10 = `${urlPrefix}/acquired-date`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.specimenDescriptionGeneric

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["specimenDescriptionGeneric"]
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

  const previousPath = data.numberOfUnmarkedSpecimens ? previousPathUnmarkedSpecimens : previousPathUniqueId 

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : `${pageContent.defaultTitle}`,
    captionText: data.speciesName,

    inputSpecimenDescriptionGeneric: {
      id: "specimenDescriptionGeneric",
      name: "specimenDescriptionGeneric",
      maxlength: 448,
      classes: "govuk-textarea govuk-js-character-count",
      label: {
        text: `${pageContent.pageHeader}`,
        isPageHeading: true,
        classes: "govuk-label--l"
      },
      ...(data.specimenDescriptionGeneric ? { value: data.specimenDescriptionGeneric } : {}),
      errorMessage: getFieldError(errorList, "#specimenDescriptionGeneric")
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
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
        numberOfUnmarkedSpecimens: species.numberOfUnmarkedSpecimens,
        specimenDescriptionGeneric: species.specimenDescriptionGeneric
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
          specimenDescriptionGeneric: Joi.string().min(5).max(449).regex(COMMENTS_REGEX).required()
        }),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const species = submission.applications[applicationIndex].species

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            speciesName: species.speciesName,
            numberOfUnmarkedSpecimens: species.numberOfUnmarkedSpecimens,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        species.specimenDescriptionGeneric = request.payload.specimenDescriptionGeneric
        species.specimenDescriptionLivingAnimal = null
        species.sex = null
        species.parentDetails = null
        species.dateOfBirth = null

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          return h.redirect(exitChangeRouteUrl)
        }
        
        if (submission.permitType === "article10") {
          return h.redirect(`${nextPathArticle10}/${applicationIndex}`
          )
        } else {
          return h.redirect(`${nextPathImporterDetails}/${applicationIndex}`
          )
        }
      }
    }
  }
]
