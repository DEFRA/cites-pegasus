const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit } = require('../lib/change-route')
const textContent = require('../content/text-content')
const { certificateUse: cu } = require('../lib/constants')
const { getPermit } = require('../lib/permit-type-helper')
const pageId = 'use-certificate-for'
const viewName = 'application-radios-layout'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/specimen-origin`
const nextPath = `${urlPrefix}/specimen-type`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel (errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.useCertificateFor
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['useCertificateFor'])

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    radios: {
      idPrefix: 'useCertificateFor',
      name: 'useCertificateFor',
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: 'govuk-fieldset__legend--l'
        }
      },
      items: [
        {
          value: cu.COMMERCIAL_ACTIVITIES,
          text: pageContent.radioOptionCommercialActivities,
          checked: isChecked(
            data.useCertificateFor,
            cu.COMMERCIAL_ACTIVITIES
          )
        },
        {
          value: cu.DISPLAY_WITHOUT_SALE,
          text: pageContent.radioOptionDisplayWithoutSale,
          checked: isChecked(
            data.useCertificateFor,
            cu.DISPLAY_WITHOUT_SALE
          )
        },
        {
          value: cu.NON_DETRIMENTAL_PURPOSES,
          text: pageContent.radioOptionNonDetrimentalPurposes,
          checked: isChecked(
            data.useCertificateFor,
            cu.NON_DETRIMENTAL_PURPOSES
          )
        },
        {
          value: cu.MOVE_LIVE_SPECIMEN,
          text: pageContent.radioOptionMoveALiveSpecimen,
          checked: isChecked(
            data.useCertificateFor,
            cu.MOVE_LIVE_SPECIMEN
          )
        },
        {
          value: cu.LEGALLY_ACQUIRED,
          text: pageContent.radioOptionLegallyAcquired,
          checked: isChecked(
            data.useCertificateFor,
            cu.LEGALLY_ACQUIRED
          )
        }
      ],
      errorMessage: getFieldError(errorList, '#useCertificateFor')
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

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        useCertificateFor: submission.applications[applicationIndex].species.useCertificateFor
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
          useCertificateFor: Joi.string().valid(...Object.values(cu)).required()
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
        const application = submission.applications[applicationIndex]

        application.species.useCertificateFor = request.payload.useCertificateFor
        application.permitSubType = getPermit(submission.otherPermitTypeOption || submission.permitTypeOption, request.payload.useCertificateFor).permitSubType

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
