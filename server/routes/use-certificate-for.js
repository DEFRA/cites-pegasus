const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const textContent = require("../content/text-content")
const pageId = "use-certificate-for"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/purpose-code`
const nextPath = `${urlPrefix}/specimen-type`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.useCertificateFor

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["useCertificateFor"]
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

    inputUseCertificateFor: {
      idPrefix: "useCertificateFor",
      name: "useCertificateFor",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "legallyAcquired",
          text: pageContent.radioOptionLegallyAcquired,
          checked: isChecked(
            data.useCertificateFor,
            "legallyAcquired"
          )
        },
        {
          value: "commercialActivities",
          text: pageContent.radioOptionCommercialActivities,
          checked: isChecked(
            data.useCertificateFor,
            "commercialActivities"
          )
        },
        {
          value:
            "other",
          text: pageContent.radioOptionOther,
          checked: isChecked(
            data.useCertificateFor,
            "other"
          )
        },
        {
          value: "moveALiveSpecimen",
          text: pageContent.radioOptionMoveALiveSpecimen,
          checked: isChecked(
            data.useCertificateFor,
            "moveALiveSpecimen"
          )
        }
      ],
      errorMessage: getFieldError(errorList, "#useCertificateFor")
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

      const pageData = {
        applicationIndex: applicationIndex,
        useCertificateFor: submission.applications[applicationIndex].species.useCertificateFor
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
          useCertificateFor: Joi.string().valid("legallyAcquired", "commercialActivities", "other", "moveALiveSpecimen").required()
        }),
        failAction: (request, h, err) => {
          const pageData = {
            applicationIndex: request.params.applicationIndex,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species
        
        species.useCertificateFor = request.payload.useCertificateFor

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

        return h.redirect(`${nextPath}/${applicationIndex}`
        )
      }
    }
  }
]
