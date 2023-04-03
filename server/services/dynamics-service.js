
const MSAL = require('@azure/msal-node');
const Wreck = require('@hapi/wreck');
const { getYarValue, setYarValue } = require('../lib/session')
var moment = require('moment');
const config = require('../../config/config').dynamicsAPI
const { readSecret } = require('../lib/key-vault')

async function  getClientCredentialsToken() {
  const clientId = await readSecret('DYNAMICS-API-CLIENT-ID')
  const clientSecret = await readSecret('DYNAMICS-API-CLIENT-SECRET')

  const msalConfig = {
    auth: {
      authority: config.authorityUrl,
      clientId: clientId.value,
      clientSecret: clientSecret.value,
      knownAuthorities: [config.knownAuthority]
    }
  }

  const cca = new MSAL.ConfidentialClientApplication(msalConfig);
  return cca.acquireTokenByClientCredential({
    scopes: [`${config.serverUrl}/.default`],
  })
}

async function getAccessToken(request) {
  const credentials = getYarValue(request, 'dynamicsClientCredentials') || null

  const expiresOn = moment(credentials?.expiresOn)
  const now = moment()
  const minsUntilExpiry = expiresOn.diff(now, 'minutes') || 0

  if (credentials === null || minsUntilExpiry < 1) {
    try {
      credentialsResponse = await getClientCredentialsToken()
      setYarValue(request, 'dynamicsClientCredentials', { accessToken: credentialsResponse.accessToken, expiresOn: credentialsResponse.expiresOn })
      return credentialsResponse.accessToken;
    }
    catch (err) {
      console.log(err)
    }
  } else {
    return credentials.accessToken
  }
}

async function whoAmI(request) {

  const accessToken = await getAccessToken(request)

  try {
    const { res, payload } = await Wreck.get(config.baseURL + 'WhoAmI', { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } })

    console.log(res.statusCode)
    console.log(payload)
    return payload
  } catch (err) {
    console.log(err)
    throw err
  }
}


async function getSpecies(request, speciesName) {

  const accessToken = await getAccessToken(request)

  try {
    const url = `${config.baseURL}cites_species(cites_scientificname='${speciesName.trim()}')`
    const { res, payload } = await Wreck.get(url, { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } })
    
    if(payload.cites_species_response){
      const json = payload.cites_species_response.replace(/(\r\n|\n|\r)/gm, "")
      return JSON.parse(json)
    }

    return null
  } catch (err) {
    console.log(err)
    throw err
  }
}

//Stubs
async function getSubmissions(request, contactId, permitTypes, statuses, startIndex, pageSize) {
  return [
    { submissionId: 'AB1234', status: 'Received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' }, 
    { submissionId: 'CD5678', status: 'Awaiting payment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
    { submissionId: 'EF9012', status: 'Issued', dateSubmitted: '2023-03-28T22:59:59.000Z', permitType: 'article10'  }
  ]
}

module.exports = { whoAmI, getSpecies, getSubmissions }