const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
const textContent = require("../content/text-content")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const pageId = "describe-specimen"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/unique-identification-mark`
const nextPathImporterDetails = `${urlPrefix}/importer-exporter`
const nextPathArticle10 = `${urlPrefix}/acquired-date`
const invalidAppDataPath = urlPrefix

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

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : `${pageContent.defaultTitle} ${data.speciesName}`,
    captionText: data.speciesName,

    inputSpecimenDescriptionGeneric: {
      id: "specimenDescriptionGeneric",
      name: "specimenDescriptionGeneric",
      maxlength: 448,
      classes: "govuk-textarea govuk-js-character-count",
      label: {
        text: `${pageContent.pageHeader} ${data.speciesName}`,
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
      const appData = getAppData(request)

      try {
        validateAppData(appData, `${pageId}/${request.params.applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const species = appData.applications[applicationIndex].species

      const pageData = {
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
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
          const appData = getAppData(request)
          const species = appData.applications[applicationIndex].species

          const pageData = {
            applicationIndex: applicationIndex,
            speciesName: species.speciesName,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const appData = getAppData(request)
        const species = appData.applications[applicationIndex].species

        species.specimenDescriptionGeneric = request.payload.specimenDescriptionGeneric
        species.specimenDescriptionLivingAnimal = null

        try {
          mergeAppData(request, { applications: appData.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }

        if (appData.permitType === "article10") {
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
