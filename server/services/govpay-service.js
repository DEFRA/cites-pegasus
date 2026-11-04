const { govpayPaymentsURL, govpayCallbackURL } = require('../../config/config')
const { readSecret } = require('../lib/key-vault')
const Wreck = require('@hapi/wreck')

async function buildReturnUrl(paymentRoute, submissionRef,contactId, organisationId){
  const ref = `${govpayCallbackURL}/${submissionRef}`
  const url = new URL(ref);

  // refer following
  // const encodedPostcode = !_.isEmpty(postcode)
  //     ? encodeURIComponent(postcode.trim())
  //     : null;
  
  if(paymentRoute) url.searchParams.append('pr',paymentRoute)
  if(contactId) url.searchParams.append('cid',contactId)
  if(organisationId)url.searchParams.append('oid',organisationId)

  return url.toString();
}

async function createPayment (request, costingValue, submissionRef, email, name, description, contactId, organisationId) {
  const returnUrl = await buildReturnUrl(request.params.paymentRoute, submissionRef, contactId, organisationId)
  const requestPayload = {
    amount: Math.round(costingValue * 100),
    reference: submissionRef,
    description: description,
    return_url: returnUrl,
    email: email,
    prefilled_cardholder_details: {
      cardholder_name: name
      //     // "billing_address": {
      //     //     "line1": "221 Baker Street",
      //     //     "line2": "Flat b",
      //     //     "postcode": "NW1 6XE",
      //     //     "city": "London",
      //     //     "country": "GB"
      //     // }
    }
  }

  try {
    const apiKey = (await readSecret('GOVPAY-API-KEY')).value
    const options = {
      json: true,
      headers: { Authorization: `Bearer ${apiKey}` },
      payload: requestPayload
    }
    console.log(`[CREATE-PAYMENT] HTTP Request Verb: POST Url: ${govpayPaymentsURL}`)
    console.log('[CREATE-PAYMENT] Request Payload: ' + JSON.stringify(requestPayload, null, 2))

    const { payload } = await Wreck.post(govpayPaymentsURL, options)

    console.log('[CREATE-PAYMENT] HTTP Response Payload: ' + JSON.stringify(payload, null, 2))

    return { paymentId: payload.payment_id, state: payload.state.status, nextUrl: payload._links.next_url.href }
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)

    throw err
  }
}

async function getPaymentStatus (paymentId) {
  try {
    const apiKey = (await readSecret('GOVPAY-API-KEY')).value
    const options = {
      json: true,
      headers: { Authorization: `Bearer ${apiKey}` }
    }
    console.log(`[PAYMENT-STATUS] HTTP Request Verb: GET Url: ${govpayPaymentsURL}/${paymentId}`)

    const { payload } = await Wreck.get(`${govpayPaymentsURL}/${paymentId}`, options)

    console.log('[PAYMENT-STATUS] HTTP Response Payload: ' + JSON.stringify(payload, null, 2))

    return { paymentId: payload.payment_id, status: payload.state.status, finished: payload.state.finished, amount: payload.amount, email: payload.email }
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)

    throw err
  }
}

module.exports = { createPayment, getPaymentStatus }
