const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { createPayment } = require('../services/govpay-service')
const { setSubmissionPayment, setPaymentReference } = require('../services/dynamics-service')
const user = require('../lib/user')
const { mergeSubmission, getSubmission } = require('../lib/submission')
const { setYarValue, getYarValue, sessionKey } = require('../lib/session')
const textContent = require('../content/text-content')
const { getPaymentStatus } = require('../services/govpay-service')
const dynamics = require('../services/dynamics-service')
const pageId = 'govpay'
const currentPath = `${urlPrefix}/${pageId}`
const cookieExpired = `${urlPrefix}/cookie-problem`
const nextPathFailed = `${urlPrefix}/payment-problem`
const invalidSubmissionPath = `${urlPrefix}/`
const nextPathSuccessNewApplication = `${urlPrefix}/application-complete`
const nextPathSuccessAccountFlow = `${urlPrefix}/payment-success`
const paymentRoutes = ['account', 'new-application']

async function getFinishedPaymentStatus (paymentId) {
  const timeoutMs = 60000 // 1 minute timeout
  const intervalMs = 2000 // 2 seconds interval

  const startTimestamp = Date.now()

  while (true) {
    const statusResponse = await getPaymentStatus(paymentId)
    console.log(statusResponse.status)

    if (statusResponse.finished) {
      return statusResponse
    }

    const elapsedMs = Date.now() - startTimestamp

    if (elapsedMs >= timeoutMs) {
      console.log('Timeout reached getting payment status')
      return statusResponse
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
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
      const { user: { contactId, organisationId } } = getYarValue(request, 'CIDMAuth')
      const submission = getSubmission(request)
      const name = `${cidmAuth.user.firstName} ${cidmAuth.user.lastName}`
      const email = cidmAuth.user.email
      let amount = submission.paymentDetails.costingValue
      const isAdditionalPayment = submission.paymentDetails.remainingAdditionalAmount > 0

      if (submission.paymentDetails.feePaid && isAdditionalPayment) {
        amount = submission.paymentDetails.remainingAdditionalAmount
      }

      const response = await createPayment(request, amount, submission.submissionRef, email, name, textContent.payApplication.paymentDescription)

      submission.paymentDetails = { paymentId: response.paymentId }

      try {
        mergeSubmission(request, { paymentDetails: submission.paymentDetails }, `${pageId}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      console.log("1. paymentRoute ---> ",request.params.paymentRoute);
      setYarValue(request, sessionKey.GOVPAY_PAYMENT_ROUTE, request.params.paymentRoute)

      let contactIdFilter = contactId
      if (user.hasOrganisationWideAccess(request)) {
        contactIdFilter = null
      }      

      const paymentReferenceParams = {
        server: request.server,
        contactId: contactIdFilter,
        organisationId,
        submissionId: submission.submissionId,
        paymentRef: response.paymentId,
        // paymentValue: paymentStatus.amount / 100,
        isAdditionalPayment,
        // previousAdditionalAmountPaid
      }

      await setPaymentReference(paymentReferenceParams)
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
      let submission = getSubmission(request)
      let { contactId, organisationId } = getYarValue(request, 'CIDMAuth')?.user || {}      

      if(!contactId) contactId = request.query.cid ? request.query.cid : null;
      if(!organisationId) organisationId = request.query.oid ? request.query.oid : null

      if (submission === null) {
        submission = await dynamics.getSubmission(request.server, contactId, organisationId, submissionRef)
        submission.contactId = contactId;
        submission.organisationId = organisationId;
        // submission.paymentRoute = request.query.pr ? request.query.pr : null
        setYarValue(request, sessionKey.GOVPAY_PAYMENT_ROUTE, request.query.pr)
        setYarValue(request, sessionKey.SUBMISSION, submission)
        setYarValue(request, sessionKey.SESSION_LOST, true)
        return h.redirect(`${cookieExpired}/new-application`)
      }

      if (submission.submissionRef !== submissionRef) {
        throw new Error('Invalid submission reference')
      }

      const paymentId = submission.paymentDetails.paymentId
      const previousAdditionalAmountPaid = submission.paymentDetails.additionalAmountPaid
      const isAdditionalPayment = submission.paymentDetails.remainingAdditionalAmount > 0

      // const paymentStatus = await getFinishedPaymentStatus(paymentId)
      const paymentStatus = "abc"

      submission.paymentDetails.paymentStatus = paymentStatus

      try {
        mergeSubmission(request, { paymentDetails: submission.paymentDetails }, `${pageId}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }
      const paymentRoute = getYarValue(request, 'govpay-paymentRoute')
      console.log("2. paymentRoute sesssion ---> ",paymentRoute);

      if (paymentStatus.status !== 'success' || paymentStatus.finished === false) {
        console.log(" Routes ---> ",`${nextPathFailed}/${paymentRoute}`);
        return h.redirect(`${nextPathFailed}/${paymentRoute}`)
      }

      let contactIdFilter = contactId
      if (user.hasOrganisationWideAccess(request)) {
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

      if (paymentRoute === 'new-application') {
        return h.redirect(nextPathSuccessNewApplication)
      } else {
        return h.redirect(nextPathSuccessAccountFlow)
      }
    }
  }
]
