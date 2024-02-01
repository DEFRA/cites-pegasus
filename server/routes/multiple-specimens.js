const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require('../content/text-content')
const nunjucks = require("nunjucks")
const pageId = 'multiple-specimens'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/unique-identification-mark`
const nextPath = `${urlPrefix}/describe-specimen`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {

  const commonContent = textContent.common
  const pageContent = textContent.multipleSpecimens

  const errorList = getErrorList(errors, {...commonContent.errorMessages, ...pageContent.errorMessages}, ["isMultipleSpecimens", "numberOfSpecimens"])
  
  // if (errors) {
  //   errorList = []
  //   const mergedErrorMessages = {
  //     ...commonContent.errorMessages,
  //     ...pageContent.errorMessages
  //   }
  //   const fields = ["numberOfSpecimens"]
  //   fields.forEach((field) => {
  //     const fieldError = findErrorList(errors, [field], mergedErrorMessages)[0]
  //     if (fieldError) {
  //       errorList.push({
  //         text: fieldError,
  //         href: `#${field}`
  //       })
  //     }
  //   })
  // }

  const renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const inputNumberOfSpecimens = nunjucks.renderString(renderString, {
    input: {
      id: "numberOfSpecimens",
      name: "numberOfSpecimens",
      classes: "govuk-input govuk-input--width-20",
      autocomplete: "on",
      label: {
        text: pageContent.inputLabelNumberOfSpecimens
      },
      // hint: {
      //   text: pageContent.inputLabelA10CertificateNumberHint
      // },
      ...(data.numberOfSpecimens ? { value: data.numberOfSpecimens } : {}),
      errorMessage: getFieldError(errorList, "#numberOfSpecimens")
    }
  })

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList && errorList?.length !== 0 ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    pageBody: pageContent.pageBody,


    isMultipleSpecimens: {
      idPrefix: "isMultipleSpecimens",
      name: "isMultipleSpecimens",
      fieldset: {
        legend: {
          text: pageContent.inputLabelIsMultipleSpecimens,
          isPageHeading: false,
          classes: "govuk-fieldset__legend--m"
        }
      },
      items: [
        {
          value: true,
          text: pageContent.radioOptionYes,
          checked: data.isMultipleSpecimens,
          conditional: {
            html: inputNumberOfSpecimens
          }
        },
        {
          value: false,
          text: pageContent.radioOptionNo,
          checked: data.isMultipleSpecimens === false
        }
      ],
      errorMessage: getFieldError(errorList, "#isA10CertificateNumberKnown")
    }
  }
  return { ...commonContent, ...model }
}

function validateNumberOfSpecimens(value, helpers) {

  if (value.length === 0) {
    return helpers.error('any.empty', { customLabel: 'numberOfSpecimens' })
  }

  const schema = Joi.number().min(1).max(1000000).integer()
  const result = schema.validate(value)

  if(result.error){
    return helpers.error(result.error.details[0].type, { customLabel: 'numberOfSpecimens' })
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

      //TODO Put this back in
      // try {
      //   validateSubmission(submission, `${pageId}/${request.params.applicationIndex}`)
      // } catch (err) {
      //   console.error(err)
      //   return h.redirect(invalidSubmissionPath)
      // }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        numberOfSpecimens: species.numberOfUnmarkedSpecimens
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
          numberOfSpecimens: Joi.any().custom(validateNumberOfSpecimens)
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
        submission.applications[applicationIndex].species.numberOfUnmarkedSpecimens = request.payload.numberOfSpecimens

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
