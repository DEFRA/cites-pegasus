const Joi = require("joi")
const textContent = require('../content/text-content')
const { getSubmission } = require('../lib/submission')
const { createPayment } = require('../services/govpay-service')
const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'payment-problem'
const currentPath = `${urlPrefix}/${pageId}`

function createModel(){
  const commonContent = textContent.common;
  const pageContent = textContent.paymentProblem;
  const submitApplicationAndPayLaterUrl = `${urlPrefix}/application-complete`
  const goBackAndTryPaymentAgainUrl= `${urlPrefix}/govpay/create-payment`
 
  return { ...commonContent, ...pageContent, goBackAndTryPaymentAgainUrl, submitApplicationAndPayLaterUrl}
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}`,
  config: {
    auth: false
  },
  handler: async (request, h) => {
       return h.view(pageId, createModel());  
  }
}]