const { govpayPaymentsURL, govpayCallbackURL } = require('../../config/config');
const { readSecret } = require('../lib/key-vault')
const Wreck = require('@hapi/wreck');

async function createPayment(costingValue, submissionRef, email, name, description) {

    const requestPayload = {
        "amount": costingValue * 100,
        "reference": submissionRef,
        "description": description,
        "return_url": `${govpayCallbackURL}/${submissionRef}`,
        "email": email,
        "prefilled_cardholder_details": {
             "cardholder_name": name
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
            headers: { 'Authorization': `Bearer ${apiKey}` },
            payload: requestPayload
        }
        const { payload } = await Wreck.post(govpayPaymentsURL, options)

        return { paymentId: payload.payment_id, state: payload.state.status, nextUrl: payload._links.next_url.href }
    } catch (err) {
        console.log(err)
        throw err
    }
}

async function getPaymentStatus(paymentId) {

    try {
        const apiKey = (await readSecret('GOVPAY-API-KEY')).value
        const options = {
            json: true,
            headers: { 'Authorization': `Bearer ${apiKey}` },
        }
        const { payload } = await Wreck.get(`${govpayPaymentsURL}/${paymentId}`, options)

        return { paymentId: payload.paymentId, status: payload.state.status, finished: payload.state.finished, amount: payload.amount, email: payload.email }
    } catch (err) {
        console.log(err)
        throw err
    }
}

module.exports = { createPayment, getPaymentStatus }