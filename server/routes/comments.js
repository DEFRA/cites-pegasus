const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const pageId = "comments"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPermitDetails = `${urlPrefix}/permit-details`
const previousPathEverImportedExported = `${urlPrefix}/ever-imported-exported`
const previousPathImporterExporter = `${urlPrefix}/importer-exporter`
const nextPath = `${urlPrefix}/application-summary/check`
const invalidSubmissionPath = `${urlPrefix}/`


function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.comments

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["comments"]
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

  let previousPath = ''
  if (data.permitType === 'export') {
      previousPath = previousPathImporterExporter
  } else if (!data.isEverImportedExported && data.permitType === 'article10') {
      previousPath = previousPathEverImportedExported
  } else if (data.permitDetails) {
    previousPath = previousPathPermitDetails
  }

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
    ? commonContent.errorSummaryTitlePrefix + errorList[0].text
    : `${pageContent.defaultTitle}`,

    inputComments: {
      id: "comments",
      name: "comments",
      maxlength: 500,
      classes: "govuk-textarea govuk-js-character-count",
      label: {
        text: pageContent.pageHeader,
        isPageHeading: true,
        classes: "govuk-label--l"
      },
      hint: {
        text: pageContent.inputHintAddRemarks
      },
      ...(data.comments ? { value: data.comments } : {}),
      errorMessage: getFieldError(errorList, "#comments")
    }
  }
  return { ...commonContent, ...model }
}

function failAction(request, h, err) {
  const { applicationIndex } = request.params
  const submission = getSubmission(request)

  const pageData = {
    backLinkOverride: checkChangeRouteExit(request, true),
    applicationIndex: applicationIndex,
    permitType: submission.permitType,
    permitDetails: submission.applications[applicationIndex].permitDetails,
    isEverImportedExported: submission.applications[applicationIndex].species.isEverImportedExported,
    ...request.payload
  }
  return h.view(pageId, createModel(err, pageData)).takeover()
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
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        permitDetails: submission.applications[applicationIndex]?.permitDetails,
        isEverImportedExported: submission.applications[applicationIndex]?.species.isEverImportedExported,
        comments: submission.applications[applicationIndex].comments
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
            comments: Joi.string().regex(COMMENTS_REGEX).optional().allow(null, ""),
        }),
        failAction: failAction
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params

        const modifiedComments = request.payload.comments.replace(/\r/g, '')
        const schema = Joi.object({ comments: Joi.string().max(500).optional().allow(null, "") })
        const result = schema.validate({comments: modifiedComments},  { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)
        }

        const submission = getSubmission(request)
        submission.applications[applicationIndex].comments = modifiedComments || ""

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

        const redirectTo = `${nextPath}/${applicationIndex}`
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
