const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { checkChangeRouteExit, setDataRemoved, getChangeRouteData } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "breeder"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const nextPathAcquiredDate = `${urlPrefix}/acquired-date`
const nextPathAlreadyHaveA10 = `${urlPrefix}/already-have-a10`
const invalidSubmissionPath = `${urlPrefix}/`

function getErrors(errors, contentErrorMessages, fields) {
  const errorList = []
  if (errors) {

    if (fields?.length > 0) {

      fields.forEach((field) => {
        const fieldError = findErrorList(errors, [field], contentErrorMessages)[0]
        if (fieldError) {
          errorList.push({
            text: fieldError,
            href: `#${field}`
          })
        }
      })
    }
  }
  return errorList.length ? errorList : null
}

function createModel(errors, data) {
  const { common: commonContent, breeder: pageContent } = textContent
  const errorList = getErrors(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['isBreeder'])

  const defaultBacklink = data.uniqueIdentificationMarkType === 'unmarked' ? `${previousPathDescribeSpecimen}/${data.applicationIndex}` : `${previousPathDescribeLivingAnimal}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,

    inputBreeder: {
      idPrefix: "isBreeder",
      name: "isBreeder",
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
          checked: data.isBreeder
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
          checked: data.isBreeder === false
        }
      ],
      errorMessage: getFieldError(errorList, "#isBreeder")
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

      const application = submission.applications[applicationIndex]

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        isBreeder: application.isBreeder,
        uniqueIdentificationMarkType: application.species.uniqueIdentificationMarkType
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
          isBreeder: Joi.boolean().required()
        }),

        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const application = submission.applications[applicationIndex]

          let isBreeder = null
          switch (request.payload.isBreeder) {
            case "true":
              isBreeder = true
              break
            case "false":
              isBreeder = false
              break
          }

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            isBreeder,
            uniqueIdentificationMarkType: application.species.uniqueIdentificationMarkType
          }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const application = submission.applications[applicationIndex]

        const isChange = typeof application.isBreeder === 'boolean' && application.isBreeder !== request.payload.isBreeder

        application.isBreeder = request.payload.isBreeder

        if (application.isBreeder) {
          application.species.acquiredDate = null
        }

        try {
          //setSubmission(request, submission, `${pageId}/${applicationIndex}`)
          mergeSubmission(
            request,
            { applications: submission.applications },

          )
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

          if (application.isBreeder === true || !changeData.dataRemoved) {
            saveDraftSubmission(request, exitChangeRouteUrl)
            return h.redirect(exitChangeRouteUrl)
          }
        }

        const redirectTo = request.payload.isBreeder ? `${nextPathAlreadyHaveA10}/${applicationIndex}` : `${nextPathAcquiredDate}/${applicationIndex}`

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
