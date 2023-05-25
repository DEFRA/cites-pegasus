const Joi = require("joi")
const { urlPrefix } = require('../../config/config')
const config = require('../../config/config')
const { createPayment } = require('../services/govpay-service')
const { setSubmissionPayment } = require('../services/dynamics-service')
const { mergeSubmission, getSubmission, validateSubmission } = require('../lib/submission')
const { setYarValue, getYarValue } = require('../lib/session')
const textContent = require('../content/text-content')
const { getDomain } = require('../lib/helper-functions')
const { getPaymentStatus } = require("../services/govpay-service")
const pageId = 'govpay'
const currentPath = `${urlPrefix}/${pageId}`
const nextPathFailed = `${urlPrefix}/payment-problem`
const nextPathSuccessNewApplication = `${urlPrefix}/application-complete`
const nextPathSuccessAccountFlow = `${urlPrefix}/payment-success`
const paymentRoutes = ['account', 'new-application']

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
    path: `${currentPath}/create-payment/{paymentRoute}`,
    options: {
      validate: {
        params: Joi.object({
          paymentRoute: Joi.string().valid(...paymentRoutes)
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
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

      submission.paymentDetails = { paymentId: response.paymentId }

      try {
        mergeSubmission(request, { paymentDetails: submission.paymentDetails }, `${pageId}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      setYarValue(request, 'govpay-paymentRoute', request.params.paymentRoute)
      return h.redirect(response.nextUrl)
    }
  },
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
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }
      const paymentRoute = getYarValue(request, 'govpay-paymentRoute')
      
      if (paymentStatus.status !== 'success' || paymentStatus.finished === false) {
        return h.redirect(`${nextPathFailed}/${paymentRoute}`)
      }

      const { user: { contactId, organisationId } } = getYarValue(request, 'CIDMAuth')  

      await setSubmissionPayment(request.server, contactId, organisationId, submission.submissionId, paymentStatus.paymentId, paymentStatus.amount / 100)      
      
      if(paymentRoute === 'newApplication') {
        return h.redirect(nextPathSuccessNewApplication)
      } else {
        return h.redirect(nextPathSuccessAccountFlow)
      }

    }
  }
]