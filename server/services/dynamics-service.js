const MSAL = require('@azure/msal-node');
const Wreck = require('@hapi/wreck');
const { getYarValue, setYarValue } = require('../lib/session')
var moment = require('moment');
const config = require('../../config/config').dynamicsAPI
const { readSecret } = require('../lib/key-vault')
const lodash = require('lodash')

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

    const options = {
      json: true,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      payload: JSON.stringify(mapSubmissionToPayload(submission))
    }

    const response = await Wreck.post(url, options)

    const { res, payload } = response

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

  return { Payload: payload }
}

async function getSpecies(server, speciesName) {

  const accessToken = await getAccessToken(server)

  try {
    //const url = `${config.baseURL}cites_species(cites_scientificname='${speciesName.trim()}')`
    //const url = `${config.baseURL}cites_species(cites_name='${speciesName.trim()}')`
    //const url = `${config.baseURL}cites_specieses?$filter=cites_name%20eq%20%27Antilocapra%20americana%27`
    const url = `${config.baseURL}cites_specieses(cites_name=%27${speciesName.trim()}%27)`
    //const url = `https://defra-apha-cites01-cites01-dev.crm11.dynamics.com/api/data/v9.2/defra_countries?$select=defra_name,defra_isocodealpha3`
    //const url = 'https://defra-apha-cites01-cites01-dev.crm11.dynamics.com/api/data/v9.2/cites_derivativecodes?$select=cites_name,cites_description'
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
    console.log(err)
    throw err
  }
}

//Stubs
const dynamicsStatusMappings = {
  'received': 0,
  'awaitingPayment': 1,
  'awaitingReply': 2,
  'inProcess': 3,
  'issued': 4,
  'refused': 5,
  'cancelled': 6,
}

const dynamicsPermitTypesMappings = {
  'import': 149900001,
  'export': 149900000,
  'reexport': 149900002,
  'article10': 149900003,
}

const reverseMapper = (mapping, dynamicsValue) => Object.entries(mapping).find(x => x[1] == dynamicsValue)[0]

async function getSubmissions(server, contactId, permitTypes, statuses, startIndex, pageSize, searchTerm) {
  const select = "$select=cites_submissionreference,cites_submissionmethod,statuscode"
  const expand = "$expand=cites_cites_submission_incident_submission($select=cites_permittype;$top=1)"
  const orderby = "$orderby=createdon desc"
  const count = "$count=true"
  const filterParts = [
    `cites_applicantagent eq '${contactId}'`,
    "cites_submissionmethod eq 149900000",
    "cites_cites_submission_incident_submission/any(o2:(o2/incidentid ne null))"
  ]

  if (statuses && statuses.length > 0) {
    const statusMappedList = statuses.map(x => `'${dynamicsStatusMappings[x]}'`).join(",")
    filterParts.push(`Microsoft.Dynamics.CRM.In(PropertyName='statuscode',PropertyValues=[${statusMappedList}])`)
  }

  if (permitTypes && permitTypes.length > 0) {
    const permitTypeMappedList = permitTypes.map(x => `'${dynamicsPermitTypesMappings[x]}'`).join(",")
    filterParts.push(`cites_cites_submission_incident_submission/any(o1:(Microsoft.Dynamics.CRM.In(PropertyName='cites_permittype',PropertyValues=[${permitTypeMappedList}])))`)
  }

  if (searchTerm) {
    const searchTermParts = [
      `cites_submissionreference eq '${searchTerm}'`,
      `cites_cites_submission_incident_submission/any(o2:(o2/cites_applicationreference eq '${searchTerm}'))`,
      `cites_cites_permit_submission_cites_submission/any(o3:(o3/cites_certificatenumber eq '${searchTerm}'))`,
      `cites_cites_submission_incident_submission/any(o4:(o4/cites_deliveryaddresspostcode eq '${searchTerm}'))`,
      `cites_cites_submission_incident_submission/any(o5:(o5/cites_partyaddresspostcode eq '${searchTerm}'))`,
      `cites_applicantfullname eq '${searchTerm}'`,
    ];
    filterParts.push(`(${searchTermParts.join(" or ")})`)
  }

  var filter = `$filter=${filterParts.join(" and ")}`

  var url = `${config.baseURL}cites_submissions?${select}&${expand}&${orderby}&${count}&${filter}`

  const accessToken = await getAccessToken(server)

  try {
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}`, 'Prefer': `odata.maxpagesize=${pageSize}` } }
    const response = await Wreck.get(url, options)

    const { res, payload } = response

    if (payload) {
      // TODO store this for later
      const nextLink = payload["@odata.nextLink"];

      return {
        submissions: payload.value.map(x => ({
          submissionId: x.cites_submissionreference,
          contactId: contactId,
          status: reverseMapper(dynamicsStatusMappings, x.statuscode),
          dateSubmitted: x.createdon,
          permitType: reverseMapper(dynamicsPermitTypesMappings, cites_cites_submission_incident_submission[0].cites_permittype)
        })),
        totalSubmissions: payload['@odata.count']
      };
    }

    return null
  } catch (err) {
    console.log(err)
    throw err
  }
}

module.exports = { whoAmI, getSpecies, getSubmissions, postSubmission }