const HTTPS = require('https');
const Wreck = require('@hapi/wreck');
const { readPfx, readCertificateFromAzureKeyVault, readCertificateFromAzureKeyVault2, readCertificateVersionFromAzureKeyVault, readSecretFromAzureKeyVault } = require('../lib/pfx')

async function getAddressesByPostcode(postcode) {

    //const accessToken = await getAccessToken(request)
    try {
        const passPhrase = 'W9S!259eRPHu'
        const certLocal = await readPfx('Boomi-CITES-TST', passPhrase)
        //Wreck.agents.https = new HTTPS.Agent(certLocal);
        
        //const pfx = await readCertificateFromAzureKeyVault('Boomi-CITES-TST')
        //Wreck.agents.https = new HTTPS.Agent({ cert: pfx.cer });

        const secret = await readSecretFromAzureKeyVault('Boomi-CITES-TST')
        const cert = new Buffer.from(secret.value, 'base64')
        Wreck.agents.https = new HTTPS.Agent({ pfx: cert });

        // const pfx = await readCertificateVersionFromAzureKeyVault('Boomi-CITES-TST')
        // const certKV = { pfx: pfx.cer }

        // Wreck.agents.https = new HTTPS.Agent({cert:certKV.pfx});

        //const url = `${config.baseURL}cites_species(cites_scientificname='${speciesName}')`
        const url = `https://integration-tst.azure.defra.cloud/ws/rest/DEFRA/v1/address/postcodes?postcode=${postcode}`
        const { res, payload } = await Wreck.get(url)
         
        if (payload) {
            console.log(JSON.parse(payload))
            return JSON.parse(payload)
        }

        return null
    } catch (err) {
        console.log(err)
        throw err
    }

}

module.exports = { getAddressesByPostcode }