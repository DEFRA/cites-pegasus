const Joi = require("joi")
const { urlPrefix, enableInternalReference, enableGenerateExportPermitsFromA10s } = require("../../config/config")
const { getErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { permitType: pt } = require('../lib/permit-type-helper')
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const pageId = "additional-info"
const currentPath = `${urlPrefix}/${pageId}`
const oldPath = `${urlPrefix}/comments`
const previousPathImportPermitDetails = `${urlPrefix}/import-permit-details`
const previousPathExportPermitDetails = `${urlPrefix}/export-permit-details`
const previousPathCountryOfOriginImport = `${urlPrefix}/country-of-origin-import`
const previousPathEverImportedExported = `${urlPrefix}/ever-imported-exported`
const previousPathImporterExporter = `${urlPrefix}/importer-exporter`
const nextPathAppSummary = `${urlPrefix}/application-summary/check`
const nextPathAddExportPermit = `${urlPrefix}/add-export-permit`
const invalidSubmissionPath = `${urlPrefix}/`
const commentsMaxLength = 500
const internalReferenceMaxLength = 30

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.additionalInfo
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["comments", "internalReference"])

  const previousPath = getPreviousPath(data.permitType, data.isEverImportedExported, data.permitDetails)

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    enableInternalReference,
    pageHeader: pageContent.pageHeader,
    inputComments: {
      id: "comments",
      name: "comments",
      maxlength: commentsMaxLength,
      classes: "govuk-textarea govuk-js-character-count",
      label: {
        text: pageContent.headingRemarks,
        isPageHeading: false,
        classes: "govuk-label--m"
      },
      hint: {
        text: pageContent.inputHintRemarks
      },
      ...(data.comments ? { value: data.comments } : {}),
      errorMessage: getFieldError(errorList, "#comments")
    },
    inputInternalReference: {
      label: {
        text: pageContent.headingInternalReference,
        classes: "govuk-label--m"
      },
      hint: {
        text: pageContent.inputHintInternalReference
      },
      id: "internalReference",
      name: "internalReference",
      classes: "govuk-input govuk-input--width-20",
      autocomplete: "on",
      ...(data.internalReference ? { value: data.internalReference } : {}),
      errorMessage: getFieldError(errorList, "#internalReference")
    }
  }
  return { ...commonContent, ...model }
}

function getPreviousPath(permitType, isEverImportedExported, permitDetails) {
  let previousPath = ''
  if (permitType === pt.EXPORT) {
    previousPath = previousPathImporterExporter
  } else if (permitType === pt.ARTICLE_10) {
    if (isEverImportedExported) {
      previousPath = previousPathImportPermitDetails
    } else {
      previousPath = previousPathEverImportedExported
    }
  } else if (permitType === pt.IMPORT) {
    if (permitDetails?.isExportOrReexportSameAsCountryOfOrigin && permitDetails?.isCountryOfOriginNotKnown === false) {
      previousPath = previousPathCountryOfOriginImport
    } else {
      previousPath = previousPathExportPermitDetails
    }
  } else {
    previousPath = previousPathImportPermitDetails
  }
  return previousPath
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
    path: `${oldPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const { applicationIndex } = request.params
      return h.redirect(`/${pageId}/${applicationIndex}`)
    }
  },
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
        comments: submission.applications[applicationIndex].comments,
        internalReference: submission.applications[applicationIndex].internalReference
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
          internalReference: Joi.string().optional().allow(null, "").max(internalReferenceMaxLength),
        }),
        failAction: failAction
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params

        const modifiedComments = request.payload.comments.replace(/\r/g, '')
        const schema = Joi.object({ comments: Joi.string().max(commentsMaxLength).optional().allow(null, "") })
        const result = schema.validate({ comments: modifiedComments }, { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)
        }

        const submission = getSubmission(request)
        submission.applications[applicationIndex].comments = modifiedComments || ""
        submission.applications[applicationIndex].internalReference = request.payload.internalReference

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

        let redirectTo = `${nextPathAppSummary}/${applicationIndex}`

        if (enableGenerateExportPermitsFromA10s && submission.permitType === pt.ARTICLE_10) {
          redirectTo = `${nextPathAddExportPermit}/${applicationIndex}`
        }

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
