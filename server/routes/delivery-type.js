const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { deliveryType: dt } = require('../lib/constants')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit } = require('../lib/change-route')
const textContent = require('../content/text-content')
const pageId = 'delivery-type'
const viewName = 'application-radios-layout'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathSelectDeliveryAddress = `${urlPrefix}/select-delivery-address`
const previousPathConfirmDeliveryAddress = `${urlPrefix}/confirm-address/delivery`
const nextPath = `${urlPrefix}/species-name/0`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel (errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.deliveryType

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['deliveryType'])

  const defaultBacklink = data.deliveryAddressOption === 'different' ? previousPathConfirmDeliveryAddress : previousPathSelectDeliveryAddress
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: currentPath,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,

    radios:
    {
      name: 'deliveryType',
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: 'govuk-fieldset__legend--l'
        }
      },
      hint: {
        text: pageContent.hintText
      },
      items: [
        {
          value: dt.STANDARD_DELIVERY,
          text: pageContent.radioOptionStandardDelivery,
          checked: isChecked(
            data.deliveryType,
            dt.STANDARD_DELIVERY
          )
        },
        {
          value: dt.SPECIAL_DELIVERY,
          text: pageContent.radioOptionSpecialDelivery,
          checked: isChecked(
            data.deliveryType,
            dt.SPECIAL_DELIVERY
          )
        }
      ],
      errorMessage: getFieldError(errorList, '#deliveryType')
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [
  {
    method: 'GET',
    path: `${currentPath}`,
    handler: async (request, h) => {
      const submission = getSubmission(request)

      try {
        validateSubmission(submission, pageId)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        deliveryAddressOption: submission.delivery.addressOption,
        deliveryType: submission.delivery.deliveryType
      }

      return h.view(viewName, createModel(null, pageData))
    }
  },

  {
    method: 'POST',
    path: currentPath,
    options: {
      validate: {
        options: { abortEarly: false },
        payload: Joi.object({
          deliveryType: Joi.string().valid(...Object.values(dt)).required()
        }),
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            deliveryAddressOption: submission.delivery.addressOption,
            applicationIndex: request.params.applicationIndex,
            ...request.payload
          }
          return h.view(viewName, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const submission = getSubmission(request)

        submission.delivery.deliveryType = request.payload.deliveryType

        try {
          mergeSubmission(
            request,
            { delivery: submission.delivery },
            pageId
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

        const redirectTo = nextPath
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
