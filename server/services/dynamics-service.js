const MSAL = require('@azure/msal-node');
const Wreck = require('@hapi/wreck');
const { getYarValue, setYarValue } = require('../lib/session')
var moment = require('moment');
const config = require('../../config/config').dynamicsAPI
const { readSecret } = require('../lib/key-vault')
const lodash = require('lodash');
//const tradeTermCode = require('../routes/trade-term-code');

async function getClientCredentialsToken() {
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

async function getAccessToken(server) {
  const credentials = server.app.dynamicsClientCredentials


  const expiresOn = moment(credentials?.expiresOn)
  const now = moment()
  const minsUntilExpiry = expiresOn.diff(now, 'minutes') || 0

  if (credentials === null || minsUntilExpiry < 1) {
    try {
      credentialsResponse = await getClientCredentialsToken()
      server.app.dynamicsClientCredentials = { accessToken: credentialsResponse.accessToken, expiresOn: credentialsResponse.expiresOn }
      return credentialsResponse.accessToken;
    }
    catch (err) {
      console.log(err)
    }
  } else {
    return credentials.accessToken
  }
}

async function whoAmI(server) {

  const accessToken = await getAccessToken(server)

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

async function postSubmission(server, submission) {

  const accessToken = await getAccessToken(server)

  try {
    const url = `${config.baseURL}cites_CreateSubmissionForPortal`

    const requestPayload = mapSubmissionToPayload(submission)

    const options = {
      json: true,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      payload: requestPayload
    }

    const { payload } = await Wreck.post(url, options)

    // if (payload.cites_species_response) {
    //   const json = payload.cites_species_response.replace(/(\r\n|\n|\r)/gm, "")
    //   return JSON.parse(json)
    // }

    return payload
  } catch (err) {
    console.log(err)
    throw err
  }
}

function addOdataTypeProperty(obj) {
  //console.log(Object.keys(obj)[0])
  //if (typeof obj !== "object" || obj === null || Object.keys(obj)[0] === 'Payload') {
  if (typeof obj !== "object" || obj === null) {
    return;
  }

  if (Array.isArray(obj)) {
    //obj.forEach(addOdataTypeProperty);
    obj.forEach((item, index) => {
      addOdataTypeProperty(item);
    });
    // const arrayName = Object.keys(obj)[0];
    // obj[arrayName + "@odata.type"] = "#Collection(Microsoft.Dynamics.CRM.expando)";
  } else {
    obj["@odata.type"] = "#Microsoft.Dynamics.CRM.expando";
    Object.values(obj).forEach(addOdataTypeProperty);
  }
}

function mapSubmissionToPayload(submission) {
  const payload = lodash.cloneDeep(submission)

  if (payload.applicant.candidateAddressData?.addressSearchData?.results) {
    payload.applicant.candidateAddressData.addressSearchData.results = null
  }

  if (payload.agent?.candidateAddressData?.addressSearchData?.results) {
    payload.agent.candidateAddressData.addressSearchData.results = null
  }

  if (payload.delivery.candidateAddressData?.addressSearchData?.results) {
    payload.delivery.candidateAddressData.addressSearchData.results = null
  }

  addOdataTypeProperty(payload)

  if (payload.supportingDocuments) {
    payload.supportingDocuments["files@odata.type"] = "#Collection(Microsoft.Dynamics.CRM.expando)"
  }

  if (payload.applications) {
    payload["applications@odata.type"] = "#Collection(Microsoft.Dynamics.CRM.expando)"
  }

  // if (payload.submissionDetails) {
  //   delete payload.submissionDetails
  // }
  
  // delete payload.applications[0].species.tradeTermCodeDesc
  
  // delete payload.applicant.address.countryDesc

  // if (payload.applicant.candidateAddressData?.selectedAddress) {
  //   delete payload.applicant.candidateAddressData?.selectedAddress?.countryDesc
  // }

  // if (payload.agent?.address) {
  //   delete payload.agent?.address?.countryDesc
  // }

  // if (payload.agent?.candidateAddressData?.selectedAddress) {
  //   delete payload.agent?.candidateAddressData?.selectedAddress?.countryDesc
  // }
  
  // delete payload.delivery.address.countryDesc
  // if (payload.delivery.candidateAddressData?.selectedAddress?.countryDesc) {
  //   delete payload.delivery.candidateAddressData?.selectedAddress?.countryDesc
  // }


  return { Payload: payload }
}

async function getSpecies(server, speciesName) {

  const accessToken = await getAccessToken(server)

  try {
    //const url = `${config.baseURL}cites_species(cites_scientificname='${speciesName.trim()}')`
    //const url = `${config.baseURL}cites_species(cites_name='${speciesName.trim()}')`
    //const url = `${config.baseURL}cites_specieses?$filter=cites_name%20eq%20%27Antilocapra%20americana%27`
    const url = `${config.baseURL}cites_specieses(cites_name=%27${speciesName.trim()}%27)`
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } }
    const response = await Wreck.get(url, options)

    const { res, payload } = response

    if (payload) {
      //const json = payload.cites_species_response.replace(/(\r\n|\n|\r)/gm, "")
      //return JSON.parse(payload)
      return { scientificName: payload.cites_name, kingdom: payload.cites_kingdom }
    }

    return null
  } catch (err) {
    if (err.data?.res?.statusCode === 404){
      //No species match
      return null
    }

    console.log(err)
    throw err
  }
}

async function getCountries(server) {
  const accessToken = await getAccessToken(server)

  try {
    const url = `${config.baseURL}defra_countries?$select=defra_name,defra_isocodealpha3&$orderby=defra_name asc`
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } }
    const { res, payload } = await Wreck.get(url, options)

    if (payload?.value) {
      return payload.value.map(country => {
        return {
          name: country.defra_name.toUpperCase(),
          code: country.defra_isocodealpha3
          //id: country.defra_countryid
        }
      })
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

async function getTradeTermCodes(server) {
  const accessToken = await getAccessToken(server)

  try {
    const url = `${config.baseURL}cites_derivativecodes?$select=cites_name,cites_description&$orderby=cites_name asc`
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } }
    const { res, payload } = await Wreck.get(url, options)

    if (payload?.value) {

      //console.log(payload.value[0])
      return payload.value.map(tradeTermCode => {
        return {
          name: tradeTermCode.cites_description,
          code: tradeTermCode.cites_name,
          id: tradeTermCode.cites_derivativecodeid
        }
      })
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

//Stubs
async function getSubmissions(server, contactId, permitTypes, statuses, startIndex, pageSize, searchTerm) {
  const submissions = [
    { submissionId: 'AB1234', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' },
    { submissionId: 'CD5678', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
    { submissionId: 'EF9012', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2023-03-28T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'GH1212', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingReply', dateSubmitted: '2023-03-27T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'IJ2323', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'inProcess', dateSubmitted: '2023-03-25T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'KL4545', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2023-03-01T22:59:59.000Z', permitType: 'reexport' },
    { submissionId: 'MN5656', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'refused', dateSubmitted: '2022-02-28T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'AB1239', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' },
    { submissionId: 'CD5679', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
    { submissionId: 'EF9019', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-03-14T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'GH1219', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'refused', dateSubmitted: '2022-03-12T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'IJ2329', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'cancelled', dateSubmitted: '2022-03-21T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'KL4549', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-03-17T22:59:59.000Z', permitType: 'reexport' },
    { submissionId: 'MN5659', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'inProcess', dateSubmitted: '2023-04-17T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'AB1238', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2022-08-02T14:02:40.000Z', permitType: 'import' },
    { submissionId: 'CD5677', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2022-11-01T09:35:12.000Z', permitType: 'export' },
    { submissionId: 'EF9018', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'cancelled', dateSubmitted: '2022-10-28T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'GH1218', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-09-27T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'IJ2328', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingReply', dateSubmitted: '2022-06-25T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'KL4548', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-05-01T22:59:59.000Z', permitType: 'reexport' },
    { submissionId: 'MN5658', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-12-28T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'AZ1234', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' },
    { submissionId: 'CZ5678', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
    { submissionId: 'EZ9012', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2023-03-28T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'GZ1212', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingReply', dateSubmitted: '2023-03-27T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'IZ2323', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'inProcess', dateSubmitted: '2023-03-25T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'KZ4545', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2023-03-01T22:59:59.000Z', permitType: 'reexport' },
    { submissionId: 'MZ5656', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'refused', dateSubmitted: '2022-02-28T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'AZ1239', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' },
    { submissionId: 'CZ5679', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
    { submissionId: 'EZ9019', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-03-14T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'GZ1219', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'refused', dateSubmitted: '2022-03-12T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'IZZ2329', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'cancelled', dateSubmitted: '2022-03-21T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'KLZ549', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-03-17T22:59:59.000Z', permitType: 'reexport' },
    { submissionId: 'MNZ5659', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'inProcess', dateSubmitted: '2023-04-17T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'AB1Z238', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2022-08-02T14:02:40.000Z', permitType: 'import' },
    { submissionId: 'CDZ5677', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2022-11-01T09:35:12.000Z', permitType: 'export' },
    { submissionId: 'EFZ9018', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'cancelled', dateSubmitted: '2022-10-28T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'GHZ1218', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-09-27T22:59:59.000Z', permitType: 'article10' },
    { submissionId: 'IJZ2328', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingReply', dateSubmitted: '2022-06-25T22:59:59.000Z', permitType: 'import' },
    { submissionId: 'KLZ4548', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-05-01T22:59:59.000Z', permitType: 'reexport' },
    { submissionId: 'MNZ5658', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-12-28T22:59:59.000Z', permitType: 'article10' }
  ]


  submissions.sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));

  const filteredSubmissions = submissions.
    filter(submission => {
      if (contactId && submission.contactId !== contactId) {
        return false
      }
      if (permitTypes && !permitTypes.includes(submission.permitType)) {
        return false
      }
      if (statuses && !statuses.includes(submission.status)) {
        return false
      }
      if (searchTerm && searchTerm !== submission.submissionId) {
        return false
      }

      return true
    })

  const endIndex = startIndex + pageSize;
  const filteredSlicedSubmissions = filteredSubmissions.slice(startIndex, endIndex);
  return { submissions: filteredSlicedSubmissions, totalSubmissions: filteredSubmissions.length };

}

module.exports = { getAccessToken, whoAmI, getSpecies, getSubmissions, postSubmission, getCountries, getTradeTermCodes }