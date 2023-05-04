const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'unmarked-specimens'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/unique-identification-mark`
const nextPath = `${urlPrefix}/describe-specimen`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {

  const commonContent = textContent.common
  const pageContent = textContent.unmarkedSpecimens

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["numberOfUnmarkedSpecimens"]
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
    pageTitle: errorList && errorList?.length !== 0 ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,

    inputNumberOfUnmarkedSpecimens: {
      id: "numberOfUnmarkedSpecimens",
      name: "numberOfUnmarkedSpecimens",
      label: {
        text: pageContent.pageHeader,
        classes: "govuk-label--l",
        isPageHeading: true
      },
      classes: "govuk-input--width-4",
      inputmode: "numeric",
      hint: {
        text: pageContent.pageHeaderHint
      },
      ...(data.numberOfUnmarkedSpecimens ? { value: data.numberOfUnmarkedSpecimens } : {}),
      errorMessage: getFieldError(errorList, '#numberOfUnmarkedSpecimens')
    },

  }
  return { ...commonContent, ...model }
}

function validateNumberOfUnmarkedSpecimens(value, helpers) {

  if (value.length === 0) {
    return helpers.error('any.empty', { customLabel: 'numberOfUnmarkedSpecimens' })
  }

  const schema = Joi.number().min(1).max(1000000).integer()
  const result = schema.validate(value)

  if(result.error){
    return helpers.error(result.error.details[0].type, { customLabel: 'numberOfUnmarkedSpecimens' })
  }

  return value
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
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        numberOfUnmarkedSpecimens: species.numberOfUnmarkedSpecimens
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
          numberOfUnmarkedSpecimens: Joi.any().custom(validateNumberOfUnmarkedSpecimens)
        }),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        submission.applications[applicationIndex].species.numberOfUnmarkedSpecimens = request.payload.numberOfUnmarkedSpecimens

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(invalidSubmissionPath)
        }
        
        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          return h.redirect(exitChangeRouteUrl)
        }

        return h.redirect(`${nextPath}/${applicationIndex}`)
      }
    }
  }
]
