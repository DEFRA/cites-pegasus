const Joi = require("joi")
const { urlPrefix, enableBreederPage } = require("../../config/config")
const { getErrorList, getFieldError, stringToBool } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "already-have-a10"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathAcquiredDate = `${urlPrefix}/acquired-date`
const previousPathBreeder = `${urlPrefix}/breeder`
const nextPath = `${urlPrefix}/ever-imported-exported`
const invalidSubmissionPath = `${urlPrefix}/`
const a10CertificateNumberMinLength = 5
const a10CertificateNumberMaxLength = 27

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.alreadyHaveA10

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["isA10CertificateNumberKnown", "a10CertificateNumber"])
  
  const renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const a10CertificateNumberInput = nunjucks.renderString(renderString, {
    input: {
      id: "a10CertificateNumber",
      name: "a10CertificateNumber",
      classes: "govuk-input govuk-input--width-20",
      autocomplete: "on",
      label: {
        text: pageContent.inputLabelA10CertificateNumber
      },
      hint: {
        text: pageContent.inputLabelA10CertificateNumberHint
      },
      ...(data.a10CertificateNumber ? { value: data.a10CertificateNumber } : {}),
      errorMessage: getFieldError(errorList, "#a10CertificateNumber")
    }
  })

  let defaultBacklink = data.isBreeder ? `${previousPathBreeder}/${data.applicationIndex}` : `${previousPathAcquiredDate}/${data.applicationIndex}`
  if(!enableBreederPage){
    defaultBacklink = `${previousPathAcquiredDate}/${data.applicationIndex}`
  }

  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    
    inputIsA10CertificateNumberKnown: {
      idPrefix: "isA10CertificateNumberKnown",
      name: "isA10CertificateNumberKnown",
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
          checked: data.isA10CertificateNumberKnown,
          conditional: {
            html: a10CertificateNumberInput
          }
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
          checked: data.isA10CertificateNumberKnown === false
        }
      ],
      errorMessage: getFieldError(errorList, "#isA10CertificateNumberKnown")
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
      const species = application.species
      
      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        speciesName: species?.speciesName,
        isA10CertificateNumberKnown: species.isA10CertificateNumberKnown,
        a10CertificateNumber: species.a10CertificateNumber,
        isBreeder: application.isBreeder
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
          isA10CertificateNumberKnown: Joi.boolean().required(),
          a10CertificateNumber: Joi.when("isA10CertificateNumberKnown", {
            is: true,
            then: Joi.string().min(a10CertificateNumberMinLength).max(a10CertificateNumberMaxLength).regex(COMMENTS_REGEX).required()
          })
        }),

        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const application = submission.applications[applicationIndex]
          const species = application.species

          const isA10CertificateNumberKnown = stringToBool(request.payload.isA10CertificateNumberKnown, null)
          
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            speciesName: species?.speciesName,
            isA10CertificateNumberKnown,
            a10CertificateNumber: request.payload.a10CertificateNumber,
            isBreeder: application.isBreeder
          }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        if (!request.payload.isA10CertificateNumberKnown) {
          species.a10CertificateNumber = ""
        }

        species.isA10CertificateNumberKnown = request.payload.isA10CertificateNumberKnown
        species.a10CertificateNumber = request.payload.isA10CertificateNumberKnown ? request.payload.a10CertificateNumber : ""

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
