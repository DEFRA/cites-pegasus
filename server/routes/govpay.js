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
const cookieExpiredBase = `${urlPrefix}/cookie-problem`
const nextPathFailed = `${urlPrefix}/payment-problem`
const invalidSubmissionPath = `${urlPrefix}/`
const nextPathSuccessNewApplication = `${urlPrefix}/application-complete`
const nextPathSuccessAccountFlow = `${urlPrefix}/payment-success`
const paymentRoutes = ['account', 'new-application']

async function getFinishedPaymentStatus (paymentId) {
  const timeoutMs = 60000 // 1 minute timeout
  const intervalMs = 2000 // 2 seconds interval

  const deadline = Date.now() + timeoutMs

  while (true) {
    const statusResponse = await getPaymentStatus(paymentId)
    if (statusResponse.finished) {
      return statusResponse
    }

    if (Date.now() >= deadline) {
      console.log(JSON.stringify({
        level: 'warn',
        context: 'PAYMENT-STATUS-POLL',
        message: 'Timeout reached before payment reached a terminal state.',
        paymentId,
        lastStatus: statusResponse.status
      }))
      return statusResponse
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}

//  Reads contactId and organisationId from the yar session.
function resolveIdentity (request) {
  const fromSession = getYarValue(request, 'CIDMAuth')?.user || {}
  return {
    contactId: fromSession.contactId || request.query.cid || null,
    organisationId: fromSession.organisationId || request.query.oid || null
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
          console.log(JSON.stringify({
            level: 'error',
            context: 'CREATE-PAYMENT-VALIDATE',
            message: error.message
          }))
          return h.redirect(invalidSubmissionPath).takeover()
        }
      }
    },
    handler: async (request, h) => {
      const cidmAuth = getYarValue(request, 'CIDMAuth')
      const { contactId, organisationId, firstName, lastName, email } = cidmAuth?.user || {}
      const submission = getSubmission(request)
      const hasCidmAuth = !!cidmAuth?.user
      const contactIdFilter = hasCidmAuth && user.hasOrganisationWideAccess(request)
        ? null
        : contactId
      let currentFeePaid = submission.paymentDetails?.feePaid
      let currentRemainingAdditional = submission.paymentDetails?.remainingAdditionalAmount
      try {
        const dynamicsSubmission = await dynamics.getSubmission(
          request.server, contactIdFilter, organisationId, submission.submissionRef
        )
        if (dynamicsSubmission) {
          currentFeePaid = dynamicsSubmission.paymentDetails?.feePaid             ?? currentFeePaid
          currentRemainingAdditional = dynamicsSubmission.paymentDetails?.remainingAdditionalAmount ?? currentRemainingAdditional
        }
      } catch (err) {
        console.warn(JSON.stringify({
          level: 'warn',
          context: 'CREATE-PAYMENT',
          submissionRef: submission.submissionRef,
          message: 'Could not re-fetch feePaid from Dynamics — using session state',
          error: err.message
        }))
      }
      // guard — do not allow re-payment on an already-paid submission ──
      const isAdditionalPayment = currentRemainingAdditional > 0
      if (currentFeePaid && !isAdditionalPayment) {
        console.warn(JSON.stringify({
          level: 'warn',
          context: 'CREATE-PAYMENT',
          message: 'Attempt to create payment for already-paid submission',
          submissionRef: submission.submissionRef
        }))
        // Redirect to success — the user has already paid
        const paymentRoute = request.params.paymentRoute
        return paymentRoute === 'new-application'
          ? h.redirect(nextPathSuccessNewApplication)
          : h.redirect(nextPathSuccessAccountFlow)
      }

      // Determine the amount to charge
      const previousAdditionalAmountPaid = submission.paymentDetails?.additionalAmountPaid
      const amount = (currentFeePaid && isAdditionalPayment)
        ? currentRemainingAdditional
        : submission.paymentDetails.costingValue

      let govpayResponse
      try {
        govpayResponse = await createPayment({
          paymentRoute: request.params.paymentRoute,
          costingValue: amount,
          submissionRef: submission.submissionRef,
          email,
          name: `${firstName} ${lastName}`,
          description: textContent.payApplication.paymentDescription,
          contactId: contactIdFilter,
          organisationId
        })
      } catch (err) {
        console.error(JSON.stringify({
          level: 'error',
          context: 'CREATE-PAYMENT',
          submissionRef: submission.submissionRef,
          message: err.message
        }))
        throw err // Hapi's error handler return a 500; do not swallow
      }

      // Persist only the new paymentId into the submission — do not clobber other fields
      try {
        mergeSubmission(
          request,
          { paymentDetails: { ...submission.paymentDetails, paymentId: govpayResponse.paymentId } },
          pageId
        )
      } catch (err) {
        console.error(JSON.stringify({
          level: 'error',
          context: 'CREATE-PAYMENT',
          submissionRef: submission.submissionRef,
          message: 'Failed to merge submission after payment creation'
        }))
        return h.redirect(invalidSubmissionPath)
      }

      setYarValue(request, sessionKey.GOVPAY_PAYMENT_ROUTE, request.params.paymentRoute)

      // Write the payment reference to Dynamics BEFORE redirecting to GovPay.
      // This ensures a reference exists even if the callback is never called.
      try {
        await setPaymentReference({
          server: request.server,
          contactId: contactIdFilter,
          organisationId,
          submissionId: submission.submissionId,
          paymentRef: govpayResponse.paymentId,
          isAdditionalPayment,
          previousAdditionalAmountPaid
        })
      } catch (err) {
        console.error(JSON.stringify({
          level: 'error',
          context: 'CREATE-PAYMENT',
          submissionRef: submission.submissionRef,
          paymentId: govpayResponse.paymentId,
          message: 'Failed to write payment reference to Dynamics'
        }))
        throw err
      }

      console.log(JSON.stringify({
        level: 'info',
        context: 'CREATE-PAYMENT',
        submissionRef: submission.submissionRef,
        paymentId: govpayResponse.paymentId,
        amount,
        isAdditionalPayment
      }))

      return h.redirect(govpayResponse.nextUrl)
    }
  },
  {
    method: 'GET',
    path: `${currentPath}/callback/{submissionRef}`,
    options: {
      auth: false
    },
    handler: async (request, h) => {
      const { submissionRef } = request.params
      const { contactId, organisationId } = resolveIdentity(request)
      let sessionWasLost = false

      // ── Resolve submission (session or Dynamics fallback) ──
      let submission = getSubmission(request)

      if (!submission) {
        sessionWasLost = true
        try {
          submission = await dynamics.getSubmission(
            request.server, contactId, organisationId, submissionRef
          )
        } catch (err) {
          console.error(JSON.stringify({
            level: 'error',
            context: 'CALLBACK',
            submissionRef,
            message: 'Dynamics lookup failed during session recovery',
            error: err.message
          }))
          throw err
        }

        if (!submission) {
          console.error(JSON.stringify({
            level: 'error',
            context: 'CALLBACK',
            submissionRef,
            message: 'Submission not found in Dynamics after session loss'
          }))
          throw new Error('Submission not found')
        }

        submission.contactId = contactId
        submission.organisationId = organisationId
        setYarValue(request, sessionKey.GOVPAY_PAYMENT_ROUTE, request.query.pr)
        setYarValue(request, sessionKey.SUBMISSION, submission)
        setYarValue(request, sessionKey.SESSION_LOST, true)
      }

      // Sanity-check the submissionRef matches what we fetched
      if (submission.submissionRef !== submissionRef) {
        console.error(JSON.stringify({
          level: 'error',
          context: 'CALLBACK',
          submissionRef,
          storedRef: submission.submissionRef,
          message: 'submissionRef mismatch — possible session corruption'
        }))
        throw new Error('Invalid submission reference')
      }

      const paymentId = submission.paymentDetails?.paymentId

      if (!paymentId) {
        console.error(JSON.stringify({
          level: 'error',
          context: 'CALLBACK',
          submissionRef,
          message: 'No paymentId found in submission — cannot check status'
        }))
        throw new Error('Missing paymentId on submission')
      }
      const isAdditionalPayment = submission.paymentDetails?.remainingAdditionalAmount > 0
      const previousAdditionalAmountPaid = submission.paymentDetails?.additionalAmountPaid

      if (submission.paymentDetails?.feePaid && !isAdditionalPayment) {
        console.log(JSON.stringify({
          level: 'info',
          context: 'CALLBACK',
          submissionRef,
          paymentId,
          message: 'Duplicate callback received — submission already paid, skipping write'
        }))
        const paymentRoute = getYarValue(request, sessionKey.GOVPAY_PAYMENT_ROUTE)
        return paymentRoute === 'new-application'
          ? h.redirect(nextPathSuccessNewApplication)
          : h.redirect(nextPathSuccessAccountFlow)
      }

      let paymentStatus
      try {
        paymentStatus = await getFinishedPaymentStatus(paymentId)
      } catch (err) {
        console.error(JSON.stringify({
          level: 'error',
          context: 'CALLBACK',
          submissionRef,
          paymentId,
          message: 'Error fetching payment status from GovPay',
          error: err.message
        }))
        throw err
      }

      // Persist status into session (non-fatal if it fails)
      try {
        mergeSubmission(
          request,
          { paymentDetails: { ...submission.paymentDetails, paymentStatus } },
          pageId
        )
      } catch (err) {
        // Log but do not abort — the session merge is a convenience, not critical path
        console.error(JSON.stringify({
          level: 'warn',
          context: 'CALLBACK',
          submissionRef,
          message: 'Failed to merge payment status into session',
          error: err.message
        }))
      }

      const paymentRoute = getYarValue(request, sessionKey.GOVPAY_PAYMENT_ROUTE)

      if (paymentStatus.status !== 'success' || paymentStatus.finished !== true) {
        console.warn(JSON.stringify({
          level: 'warn',
          context: 'CALLBACK',
          submissionRef,
          paymentId,
          status: paymentStatus.status,
          finished: paymentStatus.finished,
          message: 'Payment did not succeed — redirecting to failure path'
        }))
        return h.redirect(`${nextPathFailed}/${paymentRoute}`)
      }
      if (paymentStatus.paymentId !== paymentId) {
        console.error(JSON.stringify({
          level:    'error',
          context:  'CALLBACK',
          submissionRef,
          expected: paymentId,
          received: paymentStatus.paymentId,
          message:  'GovPay paymentId does not match submission record — possible replay'
        }))
        throw new Error('Payment ID mismatch')
      }
      const paymentValuePounds = paymentStatus.amount / 100
      if (!Number.isFinite(paymentValuePounds) || paymentValuePounds <= 0) {
        console.error(JSON.stringify({
          level: 'error',
          context: 'CALLBACK',
          submissionRef,
          paymentId,
          rawAmount: paymentStatus.amount,
          message: 'Invalid payment amount received from GovPay'
        }))
        throw new Error('Invalid payment amount')
      }
      const hasCidmAuth = !!getYarValue(request, 'CIDMAuth')?.user 
      const contactIdFilter = hasCidmAuth && user.hasOrganisationWideAccess(request)
        ? null
        : contactId

      try {
        await setSubmissionPayment({
          server: request.server,
          contactId: contactIdFilter,
          organisationId,
          submissionId: submission.submissionId,
          paymentRef: paymentStatus.paymentId,
          paymentValue: paymentValuePounds,
          isAdditionalPayment,
          previousAdditionalAmountPaid
        })
      } catch (err) {
        console.error(JSON.stringify({
          level: 'error',
          context: 'CALLBACK',
          submissionRef,
          paymentId,
          paymentValuePounds,
          message: 'CRITICAL: GovPay payment succeeded but Dynamics write failed',
          error: err.message
        }))
        throw err
      }

      setYarValue(request, sessionKey.SESSION_LOST, false)

      console.log(JSON.stringify({
        level: 'info',
        context: 'CALLBACK',
        submissionRef,
        paymentId,
        paymentValuePounds,
        isAdditionalPayment,
        sessionWasLost,
        message: 'Payment write to Dynamics succeeded'
      }))
      if (sessionWasLost) {
        return h.redirect(`${cookieExpiredBase}/new-application`)
      }

      return paymentRoute === 'new-application'
        ? h.redirect(nextPathSuccessNewApplication)
        : h.redirect(nextPathSuccessAccountFlow)
    }
  }
]
