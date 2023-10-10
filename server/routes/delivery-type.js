const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "delivery-type"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/select-delivery-address`
const nextPath = `${urlPrefix}/species-name/0`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.deliveryType

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["deliveryType"]
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

  const defaultBacklink = previousPath
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
    formActionPage: currentPath,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,

    radiosDeliveryType: 
      {
        idPrefix: "deliveryType",
        name: "deliveryType",
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
            value: "standardDelivery",
            text: pageContent.radioOptionStandardDelivery,
            checked: isChecked(
              data.deliveryType,
              "standardDelivery"
            )
          },
          {
            value: "specialDelivery",
            text: pageContent.radioOptionSpecialDelivery,
            checked: isChecked(
              data.deliveryType,
              "specialDelivery"
            )
          }
        ],
        errorMessage: getFieldError(errorList, "#deliveryType")
      }
  }
  return { ...commonContent, ...model }
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}`,
    handler: async (request, h) => {
      const submission = getSubmission(request)

      try {
        //validateSubmission(submission, pageId)//TODO Uncomment this
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        deliveryType: submission.deliveryType
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },

  // {
  //   method: "POST",
  //   path: `${currentPath}/{applicationIndex}`,
  //   options: {
  //     validate: {
  //       params: Joi.object({
  //         applicationIndex: Joi.number().required()
  //       }),
  //       options: { abortEarly: false },
  //       payload: Joi.object({
  //         useCertificateFor: Joi.string().valid("legallyAcquired", "commercialActivities", "nonDetrimentalPurposes", "displayWithoutSale", "moveALiveSpecimen").required()
  //       }),
  //       failAction: (request, h, err) => {
  //         const pageData = {
  //           backLinkOverride: checkChangeRouteExit(request, true),
  //           applicationIndex: request.params.applicationIndex,
  //           ...request.payload
  //         }
  //         return h.view(pageId, createModel(err, pageData)).takeover()
  //       }
  //     },
  //     handler: async (request, h) => {
  //       const { applicationIndex } = request.params
  //       const submission = getSubmission(request)
  //       const species = submission.applications[applicationIndex].species
        
  //       species.useCertificateFor = request.payload.useCertificateFor

  //       try {
  //         mergeSubmission(
  //           request,
  //           { applications: submission.applications },
  //           `${pageId}/${applicationIndex}`
  //         )
  //       } catch (err) {
  //         console.error(err)
  //         return h.redirect(invalidSubmissionPath)
  //       }

  //       const exitChangeRouteUrl = checkChangeRouteExit(request, false)
  //       if (exitChangeRouteUrl) {
  //         saveDraftSubmission(request, exitChangeRouteUrl)
  //         return h.redirect(exitChangeRouteUrl)
  //       }
        
  //       const redirectTo = `${nextPath}/${applicationIndex}`
  //       saveDraftSubmission(request, redirectTo)
  //       return h.redirect(redirectTo)
        
  //     }
  //   }
  // }
]
