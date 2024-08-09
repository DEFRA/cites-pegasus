const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "specimen-origin"
const viewName = 'application-radios-layout'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/source-code`
const nextPath = `${urlPrefix}/use-certificate-for`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.specimenOrigin

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["specimenOrigin"])

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    radios: {
      name: "specimenOrigin",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      hint: {
        text: pageContent.hintText
      },
      items: [
        {
          value: "a",
          text: pageContent.radioOptionA,
          checked: isChecked(
            data.specimenOrigin,
            "a"
          )
        },
        {
          value: "b",
          text: pageContent.radioOptionB,
          checked: isChecked(
            data.specimenOrigin,
            "b"
          )
        },
        {
          value: "c",
          text: pageContent.radioOptionC,
          checked: isChecked(
            data.specimenOrigin,
            "c"
          )
        },
        {
          value: "d",
          text: pageContent.radioOptionD,
          checked: isChecked(
            data.specimenOrigin,
            "d"
          )
        },
        {
          value: "e",
          text: pageContent.radioOptionE,
          checked: isChecked(
            data.specimenOrigin,
            "e"
          )
        },
        {
          value: "f",
          text: pageContent.radioOptionF,
          checked: isChecked(
            data.specimenOrigin,
            "f"
          )
        },
        {
          value: "g",
          text: pageContent.radioOptionG,
          checked: isChecked(
            data.specimenOrigin,
            "g"
          )
        }
      ],
      errorMessage: getFieldError(errorList, "#specimenOrigin")
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

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        specimenOrigin: submission.applications[applicationIndex].species.specimenOrigin
      }

      return h.view(viewName, createModel(null, pageData))
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
          specimenOrigin: Joi.string().valid("a", "b", "c", "d", "e", "f", "g").required()
        }),
        failAction: (request, h, err) => {
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: request.params.applicationIndex,
            ...request.payload
          }
          return h.view(viewName, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species
        
        species.specimenOrigin = request.payload.specimenOrigin

        try {
          mergeSubmission(
            request,
            { applications: submission.applications },
            `${pageId}/${applicationIndex}`
          )
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
