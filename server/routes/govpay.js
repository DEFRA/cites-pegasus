const Joi = require("joi")
const { urlPrefix } = require('../../config/config')
const config = require('../../config/config')
const { createPayment } = require('../services/govpay-service')
const { setSubmissionPayment } = require('../services/dynamics-service')
const user = require('../lib/user')
const { mergeSubmission, getSubmission, validateSubmission } = require('../lib/submission')
const { setYarValue, getYarValue, sessionKey } = require('../lib/session')
const textContent = require('../content/text-content')
const { getDomain } = require('../lib/helper-functions')
const { getPaymentStatus } = require("../services/govpay-service")
const pageId = 'govpay'
const currentPath = `${urlPrefix}/${pageId}`
const nextPathFailed = `${urlPrefix}/payment-problem`
const invalidSubmissionPath = `${urlPrefix}/`
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
        failAction: (_request, _h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const cidmAuth = getYarValue(request, 'CIDMAuth')
      const submission = getSubmission(request)
      const name = `${cidmAuth.user.firstName} ${cidmAuth.user.lastName}`
      const email = cidmAuth.user.email
      let amount = submission.paymentDetails.costingValue
      
      if(submission.paymentDetails.feePaid && submission.paymentDetails.remainingAdditionalAmount > 0) {
        amount = submission.paymentDetails.remainingAdditionalAmount
      }

      const response = await createPayment(amount, submission.submissionRef, email, name, textContent.payApplication.paymentDescription)

      submission.paymentDetails = { paymentId: response.paymentId }

      try {
        mergeSubmission(request, { paymentDetails: submission.paymentDetails }, `${pageId}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      setYarValue(request, sessionKey.GOVPAY_PAYMENT_ROUTE, request.params.paymentRoute)
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
      const previousAdditionalAmountPaid = submission.paymentDetails.additionalAmountPaid
      const isAdditionalPayment = submission.paymentDetails.remainingAdditionalAmount > 0         

      const paymentStatus = await getFinishedPaymentStatus(paymentId)

      submission.paymentDetails.paymentStatus = paymentStatus

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

      let contactIdFilter = contactId
      if(user.hasOrganisationWideAccess(request)) {
        contactIdFilter = null
      }

      const submissionPaymentParams = {
        server: request.server,
        contactId: contactIdFilter,
        organisationId,
        submissionId: submission.submissionId,
        paymentRef: paymentStatus.paymentId,
        paymentValue: paymentStatus.amount / 100,
        isAdditionalPayment,
        previousAdditionalAmountPaid
      }

      await setSubmissionPayment(submissionPaymentParams)      
      
      if(paymentRoute === 'new-application') {
        return h.redirect(nextPathSuccessNewApplication)
      } else {
        return h.redirect(nextPathSuccessAccountFlow)
      }

    }
  }
]