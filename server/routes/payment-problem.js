const Joi = require("joi")
const textContent = require('../content/text-content')
const { getSubmission } = require('../lib/submission')
const { createPayment } = require('../services/govpay-service')
const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'payment-problem'
const currentPath = `${urlPrefix}/${pageId}`

function createModel(nextPath){
  const commonContent = textContent.common;
  const pageContent = textContent.paymentProblem;
  const submitApplicationAndPayLaterUrl = `${urlPrefix}/application-complete`
  const goBackAndTryPaymentAgainUrl= nextPath
 

  return { ...commonContent, ...pageContent, goBackAndTryPaymentAgainUrl, submitApplicationAndPayLaterUrl}
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}`,
  handler: async (request, h) => {
    const submission = getSubmission(request)

    let name = ''
        let email = ''
        if (submission.isAgent) {
          name = submission.agent.fullName
          email = submission.agent.email
        } else {
          name = submission.applicant.fullName
          email = submission.applicant.email
        }

    const response = await createPayment(submission.paymentDetails.costingValue, submission.submissionRef, email, name, textContent.payApplication.paymentDescription)

    const nextPath = response.nextUrl



    return h.view(pageId, createModel(nextPath));  
  }
}]