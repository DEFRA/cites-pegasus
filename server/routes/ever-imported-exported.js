const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError, stringToBool } = require("../lib/helper-functions")
const { getSubmission, setSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { checkChangeRouteExit, setDataRemoved, getChangeRouteData } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "ever-imported-exported"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/already-have-a10`
const nextPathOriginPermitDetails = `${urlPrefix}/origin-permit-details`
const nextPathAdditionalInfo = `${urlPrefix}/additional-info`
const invalidSubmissionPath = `${urlPrefix}/`

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

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,

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

function getRedirect(isEverImportedExported, permitType, applicationIndex) {
  return isEverImportedExported && permitType !== 'export' ? `${nextPathOriginPermitDetails}/${applicationIndex}` : `${nextPathAdditionalInfo}/${applicationIndex}`
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

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
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

          const isEverImportedExported = stringToBool(request.payload.isEverImportedExported, null)

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
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
        const application = submission.applications[applicationIndex]
        const species = submission.applications[applicationIndex].species

        const isChange = (species.isEverImportedExported === true || species.isEverImportedExported === false) && species.isEverImportedExported !== request.payload.isEverImportedExported

        species.isEverImportedExported = request.payload.isEverImportedExported

        if (isChange) {
          if (species.isEverImportedExported === false) {
            application.permitDetails = null
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
          const changeData = getChangeRouteData(request)
          
          if (species.isEverImportedExported !== true || !changeData.dataRemoved ) {
            saveDraftSubmission(request, exitChangeRouteUrl)
            return h.redirect(exitChangeRouteUrl)
          }
        }

        //request.payload.isEverImportedExported && submission.permitType !== 'export' ? `${nextPathOriginPermitDetails}/${applicationIndex}` : `${nextPathAdditionalInfo}/${applicationIndex}`
        const redirectTo = getRedirect(request.payload.isEverImportedExported, submission.permitType, applicationIndex)
        
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
