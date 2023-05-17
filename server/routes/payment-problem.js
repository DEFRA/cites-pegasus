const Joi = require("joi")
const textContent = require('../content/text-content')
const { getSubmission } = require('../lib/submission')
const { createPayment } = require('../services/govpay-service')
const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'payment-problem'
const currentPath = `${urlPrefix}/${pageId}`
const paymentRoutes = ['account', 'new-application']

function createModel(paymentRoute) {
  const commonContent = textContent.common;
  const pageContent = textContent.paymentProblem;
  const submitApplicationAndPayLaterUrl = `${urlPrefix}/application-complete`
  const returnToYourApplicationsUrl = `${urlPrefix}/`
  const goBackAndTryPaymentAgainUrl = `${urlPrefix}/govpay/create-payment/${paymentRoute}`

  return { ...commonContent, ...pageContent, goBackAndTryPaymentAgainUrl, submitApplicationAndPayLaterUrl, returnToYourApplicationsUrl, paymentRoute }
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}/{paymentRoute}`,
  config: {
    auth: false,
    validate: {
      params: Joi.object({
        paymentRoute: Joi.string().valid(...paymentRoutes)
      }),
      failAction: (request, h, error) => {
        console.log(error)
      }
    },

    handler: async (request, h) => {
      return h.view(pageId, createModel(request.params.paymentRoute));
    }
  },
}]