const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getErrorList, getFieldError, stringToBool } = require('../lib/helper-functions')
const { getSubmission, setSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved, getChangeRouteData } = require('../lib/change-route')
const textContent = require('../content/text-content')
const pageId = 'add-export-permit'
const viewName = 'application-radios-layout'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathAdditionalInfo = `${urlPrefix}/additional-info`
const nextPathAppSummary = `${urlPrefix}/application-summary/check`
const nextPathImporterDetails = `${urlPrefix}/importer-details`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel (errors, data) {
  const { common: commonContent, addExportPermit: pageContent } = textContent
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['isExportPermitRequired'])

  const defaultBacklink = `${previousPathAdditionalInfo}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix
      : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    pageBody1: pageContent.pageBody1,
    pageBody2: pageContent.pageBody2,
    radios: {
      idPrefix: 'isExportPermitRequired',
      name: 'isExportPermitRequired',
      classes: 'govuk-radios--inline',
      fieldset: {
        legend: {
          text: pageContent.inputIsExportPermitRequiredHeading,
          isPageHeading: false,
          classes: 'govuk-fieldset__legend--m'
        }
      },
      items: [
        {
          value: true,
          text: pageContent.inputIsExportPermitRequiredYes,
          checked: data.isExportPermitRequired
        },
        {
          value: false,
          text: pageContent.inputIsExportPermitRequiredNo,
          checked: data.isExportPermitRequired === false
        }
      ],
      errorMessage: getFieldError(errorList, '#isExportPermitRequired')
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [
  {
    method: 'GET',
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

      const application = submission.applications[applicationIndex]

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        isExportPermitRequired: application.a10ExportData?.isExportPermitRequired
      }

      return h.view(viewName, createModel(null, pageData))
    }
  },
  {
    method: 'POST',
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          isExportPermitRequired: Joi.boolean().required()
        }),

        failAction: (request, h, err) => {
          const { applicationIndex } = request.params

          const isExportPermitRequired = stringToBool(request.payload.isExportPermitRequired, null)

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            isExportPermitRequired
          }

          return h.view(viewName, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const application = submission.applications[applicationIndex]

        const isChange = typeof application.a10ExportData?.isExportPermitRequired === 'boolean' && application.a10ExportData?.isExportPermitRequired !== request.payload.isExportPermitRequired

        if (!('a10ExportData' in application)) {
          application.a10ExportData = { purposeCode: 'T' }
        }
        application.a10ExportData.isExportPermitRequired = request.payload.isExportPermitRequired

        if (!request.payload.isExportPermitRequired) {
          application.a10ExportData.importerDetails = null
        }

        try {
          setSubmission(request, submission, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        if (isChange) {
          setDataRemoved(request)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          const changeData = getChangeRouteData(request)

          if (application.a10ExportData.isExportPermitRequired === true || !changeData.dataRemoved) {
            saveDraftSubmission(request, exitChangeRouteUrl)
            return h.redirect(exitChangeRouteUrl)
          }
        }

        const redirectTo = request.payload.isExportPermitRequired ? `${nextPathImporterDetails}/${applicationIndex}` : `${nextPathAppSummary}/${applicationIndex}`

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
