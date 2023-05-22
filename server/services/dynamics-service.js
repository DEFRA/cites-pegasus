const MSAL = require('@azure/msal-node');
const Wreck = require('@hapi/wreck');
const { getYarValue, setYarValue } = require('../lib/session')
var moment = require('moment');
const config = require('../../config/config').dynamicsAPI
const { readSecret } = require('../lib/key-vault')
const lodash = require('lodash');
//const tradeTermCode = require('../routes/trade-term-code');
const apiUrl = config.baseURL + config.apiPath

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
    scopes: [`${config.baseURL}/.default`],
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
      if (err.data?.payload) {
        console.error(err.data.payload)
      }
      console.error(err)
      throw err
    }
  } else {
    return credentials.accessToken
  }
}

async function whoAmI(server) {

  const accessToken = await getAccessToken(server)

  try {
    const { res, payload } = await Wreck.get(apiUrl + 'WhoAmI', { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } })

    console.log(res.statusCode)
    console.log(payload)
    return payload
  } catch (err) {
    console.error(err)
    throw err
  }
}

async function postSubmission(server, submission) {

  const accessToken = await getAccessToken(server)

  try {
    const url = `${apiUrl}cites_CreateSubmissionForPortal`

    const requestPayload = mapSubmissionToPayload(submission)

    const options = {
      json: true,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      payload: requestPayload
    }

    console.log(`HTTP Request Verb: POST Url: ${url}`)
    console.log('Request Payload: ' + JSON.stringify(requestPayload, null, 2))

    const { payload } = await Wreck.post(url, options)

    console.log('HTTP Response Payload: ' + JSON.stringify(payload, null, 2))

    // if (payload.cites_species_response) {
    //   const json = payload.cites_species_response.replace(/(\r\n|\n|\r)/gm, "")
    //   return JSON.parse(json)
    // }

    return payload
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
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
    const url = `${apiUrl}cites_specieses(cites_name=%27${speciesName.trim()}%27)`
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } }
    console.log(url)
    const response = await Wreck.get(url, options)

    const { payload } = response

    if (payload) {
      //const json = payload.cites_species_response.replace(/(\r\n|\n|\r)/gm, "")
      //return JSON.parse(payload)
      return { scientificName: payload.cites_name, kingdom: payload.cites_kingdom }
    }

    return null
  } catch (err) {
    if (err.data?.res?.statusCode === 404) {
      //No species match
      return null
    }

    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

async function getCountries(server) {
  const accessToken = await getAccessToken(server)

  try {
    const url = `${apiUrl}defra_countries?$select=defra_name,defra_isocodealpha2,defra_isocodealpha3&$orderby=defra_name asc`
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } }
    const { payload } = await Wreck.get(url, options)

    if (payload?.value) {
      return payload.value.map(country => {
        return {
          name: country.defra_name.toUpperCase(),
          code: country.defra_isocodealpha2
          //id: country.defra_countryid
        }
      })
    }
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

async function getTradeTermCodes(server) {
  const accessToken = await getAccessToken(server)

  try {
    const url = `${apiUrl}cites_derivativecodes?$select=cites_name,cites_description&$orderby=cites_name asc`
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } }
    const { payload } = await Wreck.get(url, options)

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
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}



function getPortalStatus(dynamicsStatus) {
  switch (dynamicsStatus) {
    case 1: // Not evaluated
    case 149900007: // To be evaluated
      return 'received'

    case 2: // Awaiting Payment
      return 'awaitingPayment'

    case 3: // Awaiting Reply
      return 'awaitingReply'

    case 149900000: // Referred to Kew Garden's
    case 149900001: // Referred to JNCC
    case 149900002: // Being Assessed
    case 149900003: // Authorised
    case 4: // Evaluated
      return 'inProcess'

    case 5: // Issued
      return 'issued'

    case 1000: // Refused
      return 'refused'

    case 149900005: // Closed
    case 149900006: // Ready to print
      return 'closed'

    case 6: //Cancelled by Applicant
      return 'cancelled'

    default:
      return ''
  }
}

function getDynamicsStatuses(portalStatuses) {
  var statuses = [];

  if (portalStatuses.includes('received')) {
    statuses.push(1)
    statuses.push(149900007)
  }

  if (portalStatuses.includes('awaitingPayment')) {
    statuses.push(2)
  }

  if (portalStatuses.includes('awaitingReply')) {
    statuses.push(3)
  }

  if (portalStatuses.includes('inProcess')) {
    statuses.push(149900000)
    statuses.push(149900001)
    statuses.push(149900002)
    statuses.push(149900003)
    statuses.push(4)
  }

  if (portalStatuses.includes('issued')) {
    statuses.push(5)
  }

  if (portalStatuses.includes('refused')) {
    statuses.push(1000)
  }

  if (portalStatuses.includes('closed')) {
    statuses.push(149900005)
    statuses.push(149900006)
  }

  if (portalStatuses.includes('cancelled')) {
    statuses.push(6)
  }
  return statuses
}

const dynamicsPermitTypesMappings = {
  'import': 149900001,
  'export': 149900000,
  'reexport': 149900002,
  'article10': 149900003,
}

function reverseMapper(mapping, value) {
  const match = Object.entries(mapping).find(x => x[1] == value)
  return match ? match[0] : value.toString()
}

async function getNewSubmissionsQueryUrl(contactId, organisationId, permitTypes, statuses, searchTerm) {
  const select = "$select=cites_submissionreference,cites_submissionmethod,statuscode,createdon"//,cites_permittype"
  const expand = "$expand=cites_cites_submission_incident_submission($select=cites_permittype;$top=1)"
  const orderby = "$orderby=createdon desc"
  const count = "$count=true"
  const filterParts = [
    `_cites_submissionagent_value eq '${contactId}'`,
    `_cites_organisation_value eq ${organisationId ? `'${organisationId}'` : 'null'}`,
    "cites_submissionmethod eq 149900000",
    "cites_cites_submission_incident_submission/any(o2:(o2/incidentid ne null))"
  ]  

  if (statuses && statuses.length > 0) {
    //const statusMappedList = statuses.map(x => `'${dynamicsStatusMappings[x]}'`).join(",")
    //const statusMappedList = getDynamicsStatuses(statuses).join(",")
    const statusMappedList = getDynamicsStatuses(statuses).map(x => `'${x}'`).join(",")
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
      `cites_cites_permit_submission_cites_submission/any(o3:(o3/cites_name eq '${searchTerm}'))`,
      `cites_cites_submission_incident_submission/any(o4:(o4/cites_deliveryaddresspostcode eq '${searchTerm}'))`,
      `cites_cites_submission_incident_submission/any(o5:(o5/cites_partyaddresspostcode eq '${searchTerm}'))`,
      `cites_applicantfullname eq '${searchTerm}'`,
    ];
    filterParts.push(`(${searchTermParts.join(" or ")})`)
  }

  var filter = `$filter=${filterParts.join(" and ")}`

  //var url = `${apiUrl}cites_submissions?${encodeURIComponent(select)}&${encodeURIComponent(expand)}&${encodeURIComponent(orderby)}&${encodeURIComponent(count)}&${encodeURIComponent(filter)}`
  return `${apiUrl}cites_submissions?${select}&${expand}&${orderby}&${count}&${filter}`
}

async function getSubmissions(server, query, pageSize) {

  //console.log(query)
  const accessToken = await getAccessToken(server)

  try {
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}`, 'Prefer': `odata.maxpagesize=${pageSize}` } }

    console.log(`HTTP Request Verb: GET Url: ${query}`)

    const response = await Wreck.get(query, options)

    const { payload } = response

    if (payload) {
      console.log('HTTP Response Payload: ' + JSON.stringify(payload, null, 2));
      return {
        submissions: payload.value.map(x => {

          return {
            submissionRef: x.cites_submissionreference,
            status: getPortalStatus(x.statuscode),
            //status: reverseMapper(dynamicsStatusMappings, x.statuscode),
            dateSubmitted: x.createdon,
            //permitType: reverseMapper(dynamicsPermitTypesMappings, x.cites_cites_submission_incident_submission[0].cites_permittype)
            //permitType: 'import'//TODO FIX THIS
          }
        }),
        nextQueryUrl: payload["@odata.nextLink"],
        totalSubmissions: payload['@odata.count']
      };
    }

    return null
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

function getPaymentCalculationType(dynamicsType) {
  switch (dynamicsType) {
    case 149900000:
      return "simple"
    case 149900001:
      return "complex"
    default:
      throw "Unknown Dynamics Payment Calculation Type."
  }
}

async function getSubmission(server, contactId, organisationId, submissionRef) {
  const top = "$top=1"
  const select = "$select=cites_portaljsoncontent,cites_portaljsoncontentcontinued,cites_submissionid,cites_totalfeecalculation,cites_paymentcalculationtype"
  const expand = "$expand=cites_cites_submission_incident_submission($select=cites_applicationreference,cites_permittype,statuscode,cites_portalapplicationindex)"
  
  const filterParts = [
    `cites_submissionreference eq '${submissionRef}'`,
    `_cites_submissionagent_value eq '${contactId}'`,
    `_cites_organisation_value eq ${organisationId ? `'${organisationId}'` : 'null'}`
  ]

  var filter = `$filter=${filterParts.join(" and ")}`

  const url = `${apiUrl}cites_submissions?${top}&${select}&${expand}&${filter}`
  //console.log(url)
  const accessToken = await getAccessToken(server)

  try {
    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } }

    console.log(`HTTP Request Verb: GET Url: ${url}`)

    const response = await Wreck.get(url, options)


    const { res, payload } = response

    if (payload) {
      console.log('HTTP Response Payload: ' + JSON.stringify(payload, null, 2));

      if (payload.value.length == 0) {
        throw `Submission not found with reference '${submissionRef}' and contact '${contactId}'`
      }

      const submission = payload.value[0]
      const dynamicsApplications = payload.value[0].cites_cites_submission_incident_submission

      const jsonContent = JSON.parse((submission.cites_portaljsoncontent) + (submission.cites_portaljsoncontentcontinued || ''))
      jsonContent.submissionRef = submissionRef
      jsonContent.submissionId = submission.cites_submissionid
      jsonContent.paymentDetails = {
        costingType: getPaymentCalculationType(submission.cites_paymentcalculationtype),
        costingValue: submission.cites_totalfeecalculation
      }

      //for (const jsonApplication of jsonContent.applications) {
      jsonContent.applications.forEach(jsonApplication => {
        dynamicsApplication = dynamicsApplications.find(x => x.cites_portalapplicationindex == jsonApplication.applicationIndex)
        jsonApplication.applicationRef = dynamicsApplication?.cites_applicationreference || `${submissionRef}/` + (jsonApplication.applicationIndex + 1).toString().padStart(3, '0') //NOTE - The second part of this condition is a bit of a fudge as it's possible that the cites_applicationreference could be null.  It's also possible tha the application ref is not just applicationIndex plus 1 though.
      })

      return jsonContent
    }

    return null
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

async function validateSubmission(accessToken, contactId, organisationId, submissionRef, submissionId) {

  try {
    if (!submissionId && !submissionRef) {
      throw 'Unable to identify submission'
    }
    const top = "$top=1"
    const select = "$select=cites_submissionreference"
    const filterParts = [
      `$filter=_cites_submissionagent_value eq '${contactId}'`,
      `_cites_organisation_value eq ${organisationId ? `'${organisationId}'` : 'null'}`
    ]
        
    if (submissionRef) {
      filterParts.push(`cites_submissionreference eq '${submissionRef}'`)
    }
    if (submissionId) {
      filterParts.push(`cites_submissionid eq '${submissionId}'`)
    }

    const url = `${apiUrl}cites_submissions?${top}&${select}&${filterParts.join(" and ")}`

    const options = { json: true, headers: { 'Authorization': `Bearer ${accessToken}` } }

    console.log(`HTTP Request Verb: GET Url: ${url}`)

    const { payload } = await Wreck.get(url, options)

    if (payload) {
      console.log('HTTP Response Payload: ' + JSON.stringify(payload, null, 2))

      if (payload.value.length == 0) {
        throw `Submission not found with details submisssionRef: '${submissionRef}', submissionId: '${submissionId}', contactId: '${contactId}', organisationId: '${organisationId}'`
      }
    }
  }
  catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

async function setSubmissionPayment(server, contactId, organisationId, submissionId, paymentRef, paymentValue) {
  const accessToken = await getAccessToken(server)
  await validateSubmission(accessToken, contactId, organisationId, null, submissionId)//Not necessary as we are using submissionId which is server side

  try {

    const url = `${apiUrl}cites_submissions(${submissionId})`

    const requestPayload = {
      cites_paymentmethod: 149900000, // Gov Pay
      cites_paymentreference: paymentRef,
      cites_totalfeeamount: paymentValue,
    }

    const options = {
      json: true,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      payload: requestPayload
    }
    console.log(`HTTP Request Verb: PATCH Url: ${url}`)
    console.log('Request Payload: ' + JSON.stringify(requestPayload, null, 2))

    const { payload } = await Wreck.patch(url, options)

    console.log('HTTP Response Payload: ' + JSON.stringify(payload, null, 2))

  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

// async function getSubmissionCosting(server, submissionRef, contactId) {

//   const accessToken = await getAccessToken(server)

//   try {
//     const url = `${apiUrl}cites_GetSubmissionCostingForPortal`

//     const requestPayload = {
//       Payload: {
//         "@odata.type": "#Microsoft.Dynamics.CRM.expando",
//         SubmissionReference: submissionRef,
//         ContactId: contactId
//       }
//     }

//     const options = {
//       json: true,
//       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
//       payload: requestPayload
//     }

//     const { payload } = await Wreck.post(url, options)

//     // if (payload.cites_species_response) {
//     //   const json = payload.cites_species_response.replace(/(\r\n|\n|\r)/gm, "")
//     //   return JSON.parse(json)
//     // }

//     return payload
//   } catch (err) {
//     console.error(err)
//     throw err
//   }
// }


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Stubs
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// async function getAccessToken(server) {

// }

// async function getSpecies(server, speciesName) {

//       return { scientificName: 'Python curtus', kingdom: 'Animalia' }

// }


// async function getCountries(server) {
//         return [
//           {name: 'UNITED KINGDOM',code: 'UK'},
//           {name: 'FRANCE',code: 'FRA'},
//           {name: 'SPAIN',code: 'SPA'}
//         ]
// }

// async function getTradeTermCodes(server) {  
//       return [
//           { name: 'Living animal', code: 'LIV', id: 'ABC' },
//           { name: 'Bark', code: 'BAR', id: 'DEF' },
//           { name: 'Horn', code: 'hor', id: 'GHI' }
//       ]
// }
// async function getNewSubmissionsQueryUrl(contactId, permitTypes, statuses, searchTerm)
// {
//   return `${apiUrl}cites_submissions?`
// }

// async function getSubmission(request, submissionRef) {
//   return {
//     "contactId": "4e76b334-0ee5-ed11-a7c7-6045bd8d148f",
//     "permitType": "import",
//     "isAgent": false,
//     "status": "received",
//     "dateSubmitted": "2023-04-02T14:02:40.000Z",
//     "applications": [{
//             "applicationIndex": 0,
//             "comments": "dgfdfhgfdgh",
//             "species": {
//                 "speciesName": "Agave parviflora",
//                 "speciesSearchData": "Agave parviflora",
//                 "kingdom": "Plantae",
//                 "sourceCode": "W",
//                 "anotherSourceCodeForI": "",
//                 "anotherSourceCodeForO": "",
//                 "enterAReason": "",
//                 "purposeCode": "B",
//                 "specimenType": "plantLiving",
//                 "quantity": "1",
//                 "unitOfMeasurement": "noOfPiecesOrParts",
//                 "tradeTermCode": "",
//                 "isTradeTermCode": false,
//                 "tradeTermCodeDesc": "",
//                 "uniqueIdentificationMarkType": "unmarked",
//                 "uniqueIdentificationMark": "",
//                 "specimenDescriptionGeneric": "hgdghdfdhgf"
//             },
//             "importerExporterDetails": {
//                 "country": "AF",
//                 "countryDesc": "AFGHANISTAN",
//                 "name": "dfhdfgh",
//                 "addressLine1": "dfgfdg",
//                 "addressLine2": "dhdgfgdf",
//                 "addressLine3": "",
//                 "addressLine4": "",
//                 "postcode": ""
//             },
//             "permitDetails": {
//                 "isExportOrReexportNotApplicable": true,
//                 "isCountryOfOriginNotApplicable": true,
//                 "exportOrReexportPermitIssueDate": {},
//                 "countryOfOriginPermitIssueDate": {}
//             }
//         }, {
//             "applicationIndex": 1,
//             "species": {
//                 "speciesName": "Antilocapra americana",
//                 "speciesSearchData": "Antilocapra americana",
//                 "kingdom": "Animalia",
//                 "sourceCode": "W",
//                 "anotherSourceCodeForI": "",
//                 "anotherSourceCodeForO": "",
//                 "enterAReason": "",
//                 "purposeCode": "E",
//                 "specimenType": "animalLiving",
//                 "createdDate": null,
//                 "uniqueIdentificationMarkType": "unmarked",
//                 "uniqueIdentificationMark": "",
//                 "numberOfUnmarkedSpecimens": "1",
//                 "specimenDescriptionLivingAnimal": null,
//                 "specimenDescriptionGeneric": "gdfsdsggdsf",
//                 "parentDetails": null,
//                 "sex": null,
//                 "dateOfBirth": null
//             },
//             "importerExporterDetails": {
//                 "country": "AF",
//                 "countryDesc": "AFGHANISTAN",
//                 "name": "ghdsgdssdfg",
//                 "addressLine1": "sdfgs",
//                 "addressLine2": "sdfg",
//                 "addressLine3": "",
//                 "addressLine4": "",
//                 "postcode": ""
//             },
//             "permitDetails": {
//                 "exportOrReexportCountry": null,
//                 "exportOrReexportCountryDesc": null,
//                 "exportOrReexportPermitNumber": null,
//                 "exportOrReexportPermitIssueDate": {
//                     "day": null,
//                     "month": null,
//                     "year": null
//                 },
//                 "isExportOrReexportNotApplicable": true,
//                 "countryOfOrigin": null,
//                 "countryOfOriginDesc": null,
//                 "countryOfOriginPermitNumber": null,
//                 "countryOfOriginPermitIssueDate": {
//                     "day": null,
//                     "month": null,
//                     "year": null
//                 },
//                 "isCountryOfOriginNotApplicable": true
//             },
//             "comments": "sdfgsdfg"
//         }
//     ],
//     "applicant": {
//         "fullName": "Paul Foster",
//         "businessName": "",
//         "email": "bgfoster+Paul@gmail.com",
//         "candidateAddressData": {
//             "selectedAddress": {
//                 "addressLine1": "sdfgsd",
//                 "addressLine2": "fsdfgsdfg",
//                 "addressLine3": "",
//                 "addressLine4": "",
//                 "postcode": "",
//                 "country": "AZ",
//                 "countryDesc": "AZERBAIJAN"
//             }
//         },
//         "address": {
//             "addressLine1": "sdfgsd",
//             "addressLine2": "fsdfgsdfg",
//             "addressLine3": "",
//             "addressLine4": "",
//             "postcode": "",
//             "country": "AZ",
//             "countryDesc": "AZERBAIJAN"
//         }
//     },
//     "delivery": {
//         "addressOption": "applicant",
//         "address": {
//             "addressLine1": "sdfgsd",
//             "addressLine2": "fsdfgsdfg",
//             "addressLine3": "",
//             "addressLine4": "",
//             "postcode": "",
//             "country": "AZ",
//             "countryDesc": "AZERBAIJAN"
//         },
//         "candidateAddressData": {}
//     },
//     "submissionRef": "AB1234",
//     "paymentDetails": {
//         "costingType": "complex",
//         "feeAmount": null
//     }
// }
// }

// async function getSubmissions(server, queryUrl, pageSize) {
//   const submissions = [
//     { submissionRef: 'AB1234', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' },
//     { submissionRef: 'CD5678', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
//     { submissionRef: 'EF9012', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2023-03-28T22:59:59.000Z', permitType: 'import' },
//     { submissionRef: 'GH1212', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingReply', dateSubmitted: '2023-03-27T22:59:59.000Z', permitType: 'article10' },
//     { submissionRef: 'IJ2323', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'inProcess', dateSubmitted: '2023-03-25T22:59:59.000Z', permitType: 'import' },
//     { submissionRef: 'KL4545', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2023-03-01T22:59:59.000Z', permitType: 'reexport' },
//     { submissionRef: 'MN5656', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'refused', dateSubmitted: '2022-02-28T22:59:59.000Z', permitType: 'article10' },
//     { submissionRef: 'AB1239', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' },
//     { submissionRef: 'CD5679', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
//     { submissionRef: 'EF9019', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-03-14T22:59:59.000Z', permitType: 'import' },
//     { submissionRef: 'GH1219', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'refused', dateSubmitted: '2022-03-12T22:59:59.000Z', permitType: 'article10' },
//     { submissionRef: 'IJ2329', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'cancelled', dateSubmitted: '2022-03-21T22:59:59.000Z', permitType: 'import' },
//     { submissionRef: 'KL4549', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-03-17T22:59:59.000Z', permitType: 'reexport' },
//     { submissionRef: 'MN5659', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'inProcess', dateSubmitted: '2023-04-17T22:59:59.000Z', permitType: 'article10' },
//     // { submissionRef: 'AB1238', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2022-08-02T14:02:40.000Z', permitType: 'import' },
//     // { submissionRef: 'CD5677', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2022-11-01T09:35:12.000Z', permitType: 'export' },
//     // { submissionRef: 'EF9018', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'cancelled', dateSubmitted: '2022-10-28T22:59:59.000Z', permitType: 'import' },
//     // { submissionRef: 'GH1218', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-09-27T22:59:59.000Z', permitType: 'article10' },
//     // { submissionRef: 'IJ2328', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingReply', dateSubmitted: '2022-06-25T22:59:59.000Z', permitType: 'import' },
//     // { submissionRef: 'KL4548', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-05-01T22:59:59.000Z', permitType: 'reexport' },
//     // { submissionRef: 'MN5658', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-12-28T22:59:59.000Z', permitType: 'article10' },
//     // { submissionRef: 'AZ1234', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' },
//     // { submissionRef: 'CZ5678', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
//     // { submissionRef: 'EZ9012', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2023-03-28T22:59:59.000Z', permitType: 'import' },
//     // { submissionRef: 'GZ1212', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingReply', dateSubmitted: '2023-03-27T22:59:59.000Z', permitType: 'article10' },
//     // { submissionRef: 'IZ2323', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'inProcess', dateSubmitted: '2023-03-25T22:59:59.000Z', permitType: 'import' },
//     // { submissionRef: 'KZ4545', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2023-03-01T22:59:59.000Z', permitType: 'reexport' },
//     // { submissionRef: 'MZ5656', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'refused', dateSubmitted: '2022-02-28T22:59:59.000Z', permitType: 'article10' },
//     // { submissionRef: 'AZ1239', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2023-04-02T14:02:40.000Z', permitType: 'import' },
//     // { submissionRef: 'CZ5679', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2023-04-01T09:35:12.000Z', permitType: 'export' },
//     // { submissionRef: 'EZ9019', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-03-14T22:59:59.000Z', permitType: 'import' },
//     // { submissionRef: 'GZ1219', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'refused', dateSubmitted: '2022-03-12T22:59:59.000Z', permitType: 'article10' },
//     // { submissionRef: 'IZZ2329', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'cancelled', dateSubmitted: '2022-03-21T22:59:59.000Z', permitType: 'import' },
//     // { submissionRef: 'KLZ549', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-03-17T22:59:59.000Z', permitType: 'reexport' },
//     // { submissionRef: 'MNZ5659', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'inProcess', dateSubmitted: '2023-04-17T22:59:59.000Z', permitType: 'article10' },
//     // { submissionRef: 'AB1Z238', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'received', dateSubmitted: '2022-08-02T14:02:40.000Z', permitType: 'import' },
//     // { submissionRef: 'CDZ5677', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingPayment', dateSubmitted: '2022-11-01T09:35:12.000Z', permitType: 'export' },
//     // { submissionRef: 'EFZ9018', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'cancelled', dateSubmitted: '2022-10-28T22:59:59.000Z', permitType: 'import' },
//     // { submissionRef: 'GHZ1218', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-09-27T22:59:59.000Z', permitType: 'article10' },
//     // { submissionRef: 'IJZ2328', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'awaitingReply', dateSubmitted: '2022-06-25T22:59:59.000Z', permitType: 'import' },
//     // { submissionRef: 'KLZ4548', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-05-01T22:59:59.000Z', permitType: 'reexport' },
//     // { submissionRef: 'MNZ5658', contactId: '9165f3c0-dcc3-ed11-83ff-000d3aa9f90e', status: 'issued', dateSubmitted: '2022-12-28T22:59:59.000Z', permitType: 'article10' }
//   ]

//   // submissions.sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));

//   // const filteredSubmissions = submissions.
//   //   filter(submission => {
//     //     if (contactId && submission.contactId !== contactId) {
//       //       return false
//       //     }
//       //     if (permitTypes && !permitTypes.includes(submission.permitType)) {
//         //       return false
//         //     }
//         //     if (statuses && !statuses.includes(submission.status)) {
//           //       return false
//           //     }
//           //     if (searchTerm && searchTerm !== submission.submissionId) {
//             //       return false
//             //     }

//             //     return true
//             //   })

//   // const endIndex = startIndex + pageSize;
//   // const filteredSlicedSubmissions = filteredSubmissions.slice(startIndex, endIndex);
//   // return { submissions: filteredSlicedSubmissions, totalSubmissions: filteredSubmissions.length };
//   return { submissions: submissions, totalSubmissions: submissions.length }  
// }

// async function postSubmission(server, submission) {
//   return { submissionRef: 'BGF5276',
//           costingValue: 75,
//           costingType: 'simple'
//   }  
// }

// async function getSubmissionCosting(server, submissionRef, contactId) {

//   return { Cost: 1.23, Type: 'complex' }
// }

module.exports = { getAccessToken, whoAmI, getSpecies, getSubmissions, getNewSubmissionsQueryUrl, postSubmission, getCountries, getTradeTermCodes, getSubmission, setSubmissionPayment }