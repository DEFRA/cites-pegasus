const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const textContent = require("../content/text-content")
const pageId = "comments"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPermitDetails = `${urlPrefix}/permit-details`
const previousPathEverImportedExported = `${urlPrefix}/ever-imported-exported`
const nextPath = `${urlPrefix}/check-your-answers`
const invalidSubmissionPath = urlPrefix


function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.comments

  const previousPath = data.permitDetails ? previousPathPermitDetails : previousPathEverImportedExported

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    pageTitle: pageContent.defaultTitle,
    captionText: data.speciesName,

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

      const pageData = {
        applicationIndex: applicationIndex,
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
            comments: Joi.string().max(100).optional().allow(null, ""),
        }),
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
      
        submission.applications[applicationIndex].comments = request.payload.comments

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        return h.redirect(`${nextPath}/${applicationIndex}`)
      }
    }
  }
]
