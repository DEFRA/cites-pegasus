const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, setLabelData } = require('../lib/helper-functions')
const { mergeSubmission, getSubmission, validateSubmission } = require('../lib/submission')
const { createPayment } = require('../services/govpay-service')
const textContent = require('../content/text-content')
const pageId = 'pay-application'
const currentPath = `${urlPrefix}/${pageId}`
//const previousPath = `${urlPrefix}/`
const nextPath = `${urlPrefix}/application-complete/`
const invalidSubmissionPath = urlPrefix

const feeAmount = 24.99

function createModel(errors, data) {
  const commonContent = textContent.common;
  const pageContent = textContent.payApplication;

  let payNowRadioVal = null

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
    //backLink: previousPath,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageHeader: pageContent.pageHeader,
    pageHeader2: pageContent.pageHeader2,
    pageBody: pageContent.pageBody,
    headingPaymentAmount: pageContent.headingPaymentAmount,
    feeAmount: `£${data}`,
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
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

// function validateSubmission(submission) {
//   if (submission.permitType === null) { throw 'submission error: permitType is null' }
//   if (submission.permitType === 'other') { throw 'submission error: permitType is "other"' }
// }

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const submission = getSubmission(request) || null

    //TODO CHECK APPLICATION STATUS AND GET FEE AMOUNT



    //TODO UNCOMMENT THIS BIT
    // try {
    //   validateSubmission(submission, pageId)      
    // }
    // catch (err) {
    //   console.log(err);
    //   return h.redirect(`${invalidSubmissionPath}/`)
    // }

    return h.view(pageId, createModel(null, feeAmount));
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
        return h.view(pageId, createModel(err, 0)).takeover()
      }
    },
    handler: async (request, h) => {
      const payNow = request.payload.payNow === textContent.common.radioOptionYes;
      const submission = getSubmission(request)

      if (payNow) {
        let name = ''
        let email = ''
        if (submission.isAgent) {
          name = submission.agent.fullName
          email = submission.agent.email
        } else {
          name = submission.applicant.fullName
          email = submission.applicant.email
        }

        const response = await createPayment(feeAmount, submission.submissionDetails.submissionRef, email, name, textContent.payApplication.paymentDescription)
        return h.redirect(response.nextUrl)
      }

      // try {
      //   mergeSubmission(request, agentData, pageId)
      // }
      // catch (err) {
      //   console.log(err);
      //   return h.redirect(`${invalidSubmissionPath}/`)
      // }

      return h.redirect(nextPath);
    }
  },
}]