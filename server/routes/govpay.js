const Joi = require("joi")
const { urlPrefix } = require('../../config/config')
const config = require('../../config/config')
const pageId = 'govpay'
const currentPath = `${urlPrefix}/${pageId}`
const { mergeSubmission, getSubmission, validateSubmission } = require('../lib/submission')
const { getDomain } = require('../lib/helper-functions')
const { getPaymentStatus } = require("../services/govpay-service")
const nextPathFailed = `${urlPrefix}/failed-payment`
const nextPathSuccess = `${urlPrefix}/application-complete`

async function getFinishedPaymentStatus(paymentId) {

  const timeoutMs = 60000; // 1 minute timeout
  const intervalMs = 2000; // 2 seconds interval

  const startTimestamp = Date.now();

  while (true) {
    const statusResponse = await getPaymentStatus(paymentId);
    console.log(statusResponse.status)

    if (statusResponse.finished) {
      return statusResponse;
    }

    const elapsedMs = Date.now() - startTimestamp;

    if (elapsedMs >= timeoutMs) {
      console.log('Timeout reached getting payment status');
      return statusResponse;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

module.exports = [
  {
    method: 'GET',
    path: `${currentPath}/callback/{submissionRef}`,
    config: {
      auth: false
    },
    // options: {
    //   validate: {
    //     params: Joi.object({
    //       submissionRef: Joi.string().required()
    //     })
    //   }
    // },
    handler: async (request, h) => {
      const { submissionRef } = request.params
      const submission = getSubmission(request)
      if (submission.submissionRef !== submissionRef) {
        throw new Error('Invalid submission reference')
      }

      const paymentId = submission.paymentDetails.paymentId

      const paymentStatus = await getFinishedPaymentStatus(paymentId, 60000, 2000)

      submission.paymentDetails = { paymentStatus }

      try {
        mergeSubmission(request, { paymentDetails: submission.paymentDetails }, `${pageId}`)          
      } catch (err) {
        console.log(err)
        return h.redirect(invalidSubmissionPath)
      }
      //TODO Update the backend with the payment outcome


      if (paymentStatus.status !== 'success') {
        return h. redirect(nextPathFailed)
      }
      if (paymentStatus.finished === false) {
        return h.redirect(nextPathFailed)
      }
      
      return h.redirect(nextPathSuccess)

    }
  }
]