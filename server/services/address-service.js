const HTTPS = require('https');
const Wreck = require('@hapi/wreck');
const { readSecret } = require('../lib/key-vault')
const { httpStatusCode } = require('../lib/constants')
const config = require('../../config/config')

async function getAddressesByPostcode(postcode) {

    try {
        const secret = await readSecret(config.addressLookupAPICertName)
        const cert = Buffer.from(secret.value, 'base64')
        Wreck.agents.https = new HTTPS.Agent({ pfx: cert });

        const url = `${config.addressLookupBaseUrl}postcodes?postcode=${postcode}`
        const { res, payload } = await Wreck.get(url)

        if (payload && res.statusCode !== httpStatusCode.NO_CONTENT) {
            console.log(JSON.parse(payload))
            return JSON.parse(payload)
        }

        return { results: [] }
    } catch (err) {
        console.error(err)
        throw err
    }

}

module.exports = { getAddressesByPostcode }