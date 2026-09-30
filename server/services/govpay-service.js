const { govpayPaymentsURL, govpayCallbackURL } = require('../../config/config')
const { readSecret } = require('../lib/key-vault')
const Wreck = require('@hapi/wreck')

class PaymentServiceError extends Error {
  constructor (message, { code, upstream } = {}) {
    super(message)
    this.name = 'PaymentServiceError'
    this.code = code // e.g. 'GOVPAY_CREATE_FAILED', 'GOVPAY_STATUS_FAILED'
    this.upstream = upstream // raw upstream payload, if any
  }
}

let _cachedApiKey = null

async function getApiKey () {
  if (!_cachedApiKey) {
    _cachedApiKey = (await readSecret('GOVPAY-API-KEY')).value
  }
  return _cachedApiKey
}

function buildReturnUrl (paymentRoute, submissionRef, contactId, organisationId) {
  const url = new URL(`${govpayCallbackURL}/${submissionRef}`)
  if (paymentRoute) url.searchParams.append('pr', paymentRoute)
  if (contactId) url.searchParams.append('cid', contactId)
  if (organisationId) url.searchParams.append('oid', organisationId)
  return url.toString()
}

function govpayHeaders (apiKey) {
  return { Authorization: `Bearer ${apiKey}` }
}

async function createPayment ({
  paymentRoute,
  costingValue,
  submissionRef,
  email,
  name,
  description,
  contactId,
  organisationId
}) {
  const returnUrl = buildReturnUrl(paymentRoute, submissionRef, contactId, organisationId)

  const requestPayload = {
    amount: Math.round(costingValue * 100),
    reference: submissionRef,
    description,
    return_url: returnUrl,
    email,
    prefilled_cardholder_details: { cardholder_name: name }
  }

  let payload
  try {
    const apiKey = await getApiKey()
    const options = {
      json: true,
      headers: govpayHeaders(apiKey),
      payload: requestPayload
    }

    console.log(JSON.stringify({
      level: 'info',
      context: 'CREATE-PAYMENT',
      method: 'POST',
      url: govpayPaymentsURL,
      submissionRef
    }))

    ;({ payload } = await Wreck.post(govpayPaymentsURL, options))

    console.log(JSON.stringify({
      level: 'info',
      context: 'CREATE-PAYMENT',
      paymentId: payload.payment_id,
      state: payload.state?.status
    }))
  } catch (err) {
    const upstream = err.data?.payload
    console.error(JSON.stringify({
      level: 'error',
      context: 'CREATE-PAYMENT',
      submissionRef,
      upstream,
      message: err.message
    }))
    throw new PaymentServiceError('Failed to create GovPay payment', {
      code: 'GOVPAY_CREATE_FAILED',
      upstream
    })
  }

  // Guard: ensure the response has the fields we need before returning
if (!payload?.payment_id || !payload?.state?.status || !payload?._links?.next_url?.href) {
    throw new PaymentServiceError('Unexpected GovPay create-payment response shape', {
      code: 'GOVPAY_INVALID_RESPONSE',
      upstream: payload
    })
  }

  return {
    paymentId: payload.payment_id,
    state: payload.state.status,
    nextUrl: payload._links.next_url.href
  }
}

async function getPaymentStatus (paymentId) {
  let payload
  try {
    const apiKey = await getApiKey()
    const options = {
      json: true,
      headers: govpayHeaders(apiKey)
    }

    console.log(JSON.stringify({
      level: 'info',
      context: 'PAYMENT-STATUS',
      method: 'GET',
      paymentId
    }));
    ({ payload } = await Wreck.get(`${govpayPaymentsURL}/${paymentId}`, options))
    console.log(JSON.stringify({
      level: 'info',
      context: 'PAYMENT-STATUS',
      paymentId,
      status: payload?.state?.status,
      finished: payload?.state?.finished
    }))
  } catch (err) {
    const upstream = err.data?.payload
    console.error(JSON.stringify({
      level: 'error',
      context: 'PAYMENT-STATUS',
      paymentId,
      upstream,
      message: err.message
    }))
    throw new PaymentServiceError('Failed to fetch GovPay payment status', {
      code: 'GOVPAY_STATUS_FAILED',
      upstream
    })
  }

  return {
    paymentId: payload.payment_id,
    status: payload.state.status,
    finished: payload.state.finished,
    amount: payload.amount,
    email: payload.email
  }
}

module.exports = { createPayment, getPaymentStatus, PaymentServiceError }
