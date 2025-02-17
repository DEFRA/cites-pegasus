const Joi = require('joi')
const textContent = require('../content/text-content')
const { urlPrefix } = require('../../config/config')
const pageId = 'payment-problem'
const currentPath = `${urlPrefix}/${pageId}`
const paymentRoutes = ['account', 'new-application']

function createModel (paymentRoute) {
  const commonContent = textContent.common
  const pageContent = textContent.paymentProblem
  const submitApplicationAndPayLaterUrl = `${urlPrefix}/application-complete`
  const returnToYourApplicationsUrl = `${urlPrefix}/`
  const goBackAndTryPaymentAgainUrl = `${urlPrefix}/govpay/create-payment/${paymentRoute}`
  const pageTitle = pageContent.defaultTitle + commonContent.pageTitleSuffix
  return { ...commonContent, ...pageContent, goBackAndTryPaymentAgainUrl, submitApplicationAndPayLaterUrl, returnToYourApplicationsUrl, paymentRoute, pageTitle }
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
      failAction: (_request, _h, error) => {
        console.log(error)
      }
    },

    handler: async (request, h) => {
      return h.view(pageId, createModel(request.params.paymentRoute))
    }
  }
}]
