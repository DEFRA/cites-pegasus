const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError, toPascalCase, stringToBool } = require("../lib/helper-functions")
const { getSubmission, setSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { checkChangeRouteExit, setDataRemoved, getChangeRouteData } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "country-of-origin-import"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/origin-permit-details`
const nextPathExportPermitDetails = `${urlPrefix}/export-permit-details`
const nextPathAdditionalInfo = `${urlPrefix}/additional-info`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.countryOfOriginImport

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["isExportOrReexportSameAsCountryOfOrigin"])

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  const pageHeader = pageContent.pageHeader.replace('##COUNTRY##', toPascalCase(data.countryOfOrigin))
  const defaultTitle = pageContent.defaultTitle.replace('##COUNTRY##', toPascalCase(data.countryOfOrigin))

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : defaultTitle + commonContent.pageTitleSuffix,

    inputIsExportOrReexportSameAsCountryOfOrigin: {
      idPrefix: "isExportOrReexportSameAsCountryOfOrigin",
      name: "isExportOrReexportSameAsCountryOfOrigin",
      classes: "govuk-radios--inline",
      fieldset: {
        legend: {
          text: pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: true,
          text: commonContent.radioOptionYes,
          checked: data.isExportOrReexportSameAsCountryOfOrigin
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
          checked: data.isExportOrReexportSameAsCountryOfOrigin === false
        }
      ],
      errorMessage: getFieldError(errorList, "#isExportOrReexportSameAsCountryOfOrigin")
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
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const permitDetails = submission.applications[applicationIndex].permitDetails

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        countryOfOrigin: permitDetails?.countryOfOriginDesc,
        isExportOrReexportSameAsCountryOfOrigin: permitDetails?.isExportOrReexportSameAsCountryOfOrigin
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
          isExportOrReexportSameAsCountryOfOrigin: Joi.boolean().required()
        }),

        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const permitDetails = submission.applications[applicationIndex].permitDetails
          const isExportOrReexportSameAsCountryOfOrigin = stringToBool(request.payload.isExportOrReexportSameAsCountryOfOrigin, null)

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            countryOfOrigin: permitDetails?.countryOfOriginDesc,
            isExportOrReexportSameAsCountryOfOrigin
          }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const permitDetails = submission.applications[applicationIndex].permitDetails

        const isChange = (permitDetails.isExportOrReexportSameAsCountryOfOrigin === true || permitDetails.isExportOrReexportSameAsCountryOfOrigin === false) && permitDetails.isExportOrReexportSameAsCountryOfOrigin !== request.payload.isExportOrReexportSameAsCountryOfOrigin

        permitDetails.isExportOrReexportSameAsCountryOfOrigin = request.payload.isExportOrReexportSameAsCountryOfOrigin

        if (isChange && permitDetails.isExportOrReexportSameAsCountryOfOrigin) {
          permitDetails.exportOrReexportCountry = null
          permitDetails.exportOrReexportCountryDesc = null
          permitDetails.exportOrReexportPermitNumber = null
          permitDetails.exportOrReexportPermitIssueDate = {
            day: null,
            month: null,
            year: null
          }
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
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        const redirectTo = request.payload.isExportOrReexportSameAsCountryOfOrigin ? `${nextPathAdditionalInfo}/${applicationIndex}` : `${nextPathExportPermitDetails}/${applicationIndex}`

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
