const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const textContent = require("../content/text-content")
const pageId = "ever-imported-exported"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/already-have-a10`
const nextPathPermitDetails = `${urlPrefix}/permit-details`
const nextPathComments = `${urlPrefix}/comments`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.everImportedExported

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["isEverImportedExported"]
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
      : pageContent.defaultTitle,
    captionText: data.speciesName,

    inputIsEverImportedExported: {
      idPrefix: "isEverImportedExported",
      name: "isEverImportedExported",
      classes: "govuk-radios--inline",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: true,
          text: commonContent.radioOptionYes,
          checked: data.isEverImportedExported
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
          checked: data.isEverImportedExported === false
        }
      ],
      errorMessage: getFieldError(errorList, "#isEverImportedExported")
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
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        applicationIndex: applicationIndex,
        speciesName: species?.speciesName,
        isEverImportedExported: species.isEverImportedExported
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
          isEverImportedExported: Joi.boolean().required()
        }),

        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const species = submission.applications[applicationIndex].species

          let isEverImportedExported = null
          switch (request.payload.isEverImportedExported) {
            case "true":
              isEverImportedExported = true
              break
            case "false":
              isEverImportedExported = false
              break
          }

          const pageData = {
            applicationIndex: applicationIndex,
            speciesName: species?.speciesName,
            isEverImportedExported: isEverImportedExported
          }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        species.isEverImportedExported = request.payload.isEverImportedExported

        try {
          mergeSubmission(
            request,
            { applications: submission.applications },
            `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        if (request.payload.isEverImportedExported && submission.permitType !== 'export') {
          return h.redirect(`${nextPathPermitDetails}/${applicationIndex}`)
        } else {
          return h.redirect(`${nextPathComments}/${applicationIndex}`)
        }
      }
    }
  }
]
