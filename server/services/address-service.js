const HTTPS = require('https');
const Wreck = require('@hapi/wreck');
const { readSecret } = require('../lib/key-vault')
const config = require('../../config/config')

async function getAddressesByPostcode(postcode) {

    //const accessToken = await getAccessToken(request)
    try {
        //const passPhrase = 'W9S!259eRPHu'
        //const certLocal = await readPfx('Boomi-CITES-TST', passPhrase)
        //Wreck.agents.https = new HTTPS.Agent(certLocal);
        
        //const pfx = await readCertificateFromAzureKeyVault('Boomi-CITES-TST')
        //Wreck.agents.https = new HTTPS.Agent({ cert: pfx.cer });

        const secret = await readSecret(config.addressLookupAPICertName)
        const cert = Buffer.from(secret.value, 'base64')
        Wreck.agents.https = new HTTPS.Agent({ pfx: cert });

        const url = `${config.addressLookupBaseUrl}postcodes?postcode=${postcode}`
        const { res, payload } = await Wreck.get(url)
         
        if (payload && res.statusCode !== 204) { //204 = No results
            console.log(JSON.parse(payload))
            return JSON.parse(payload)
        }

        return {results: []}
    } catch (err) {
        console.error(err)
        throw err
    }

}

module.exports = { getAddressesByPostcode }