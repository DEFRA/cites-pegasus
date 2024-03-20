const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError, setLabelData } = require('../lib/helper-functions')
const { mergeSubmission, getSubmission, validateSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const pageId = 'pay-application'
const currentPath = `${urlPrefix}/${pageId}`
//const previousPath = `${urlPrefix}/`
const nextPathCreatePayment = `${urlPrefix}/govpay/create-payment/new-application`
const nextPathNoPayment = `${urlPrefix}/application-complete`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common;
  const pageContent = textContent.payApplication;

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
    const fields = ['payNow']
    fields.forEach(field => {
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
    
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageHeader: pageContent.pageHeader,
    pageHeader2: pageContent.pageHeader2,
    pageBody: pageContent.pageBody,
    pageBody2: pageContent.pageBody2,
    headingPaymentAmount: pageContent.headingPaymentAmount,
    costingValue: `£${data}`,
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text  + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    inputPayNow: {
      id: "payNow",
      name: "payNow",
      classes: "govuk-radios--inline",
      fieldset: {
        legend: {
          text: pageContent.pageHeader2,
          isPageHeading: false,
          classes: "govuk-fieldset__legend--m"
        }
      },
      items: [
        {
          value: commonContent.radioOptionYes,
          text: pageContent.radioOptionYes
        },
        {
          value: commonContent.radioOptionNo,
          text: pageContent.radioOptionNo
        }
      ],
      // setLabelData(payNowRadioVal, [pageContent.radioOptionYes, pageContent.radioOptionNo]),
      errorMessage: getFieldError(errorList, '#payNow')
    }
  }
  return { ...commonContent, ...model }

}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const submission = getSubmission(request) || null
    
    let costingValue = null

    costingValue = submission.paymentDetails.costingValue
    
    if (submission.paymentDetails.costingType === 'complex') {
      return h.redirect(nextPathNoPayment);
    }

    return h.view(pageId, createModel(null, costingValue));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        payNow: Joi.string().required().valid(textContent.common.radioOptionYes, textContent.common.radioOptionNo)
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request) || null

        const costingValue = submission.paymentDetails.costingValue

        return h.view(pageId, createModel(err, costingValue)).takeover()
      }
    },
    handler: async (request, h) => {
      const payNow = request.payload.payNow === textContent.common.radioOptionYes;

      if (payNow) {
        return h.redirect(nextPathCreatePayment);
      }

      return h.redirect(nextPathNoPayment);
    }
  },
}]