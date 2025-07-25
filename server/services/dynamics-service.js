const MSAL = require('@azure/msal-node')
const Wreck = require('@hapi/wreck')
const moment = require('moment')
const config = require('../../config/config')
const { readSecret } = require('../lib/key-vault')
const { httpStatusCode } = require('../lib/constants')
const lodash = require('lodash')
const apiUrl = config.dynamicsAPI.baseURL + config.dynamicsAPI.apiPath
const httpResponsePrefix = 'HTTP Response Payload: '
const collectionExpandoString = '#Collection(Microsoft.Dynamics.CRM.expando)'
const countString = '@odata.count'
const dynamicsStatusCodeConst = {
  awaitingPayment: 1,
  inProgress: 149900002,
  awaitingAdditionalPayment: 149900003
}

async function getClientCredentialsToken () {
  const clientId = await readSecret('DYNAMICS-API-CLIENT-ID')
  const clientSecret = await readSecret('DYNAMICS-API-CLIENT-SECRET')

  const msalConfig = {
    auth: {
      authority: config.dynamicsAPI.authorityUrl,
      clientId: clientId.value,
      clientSecret: clientSecret.value,
      knownAuthorities: [config.dynamicsAPI.knownAuthority]
    }
  }

  const cca = new MSAL.ConfidentialClientApplication(msalConfig)
  return cca.acquireTokenByClientCredential({
    scopes: [`${config.dynamicsAPI.baseURL}/.default`]
  })
}

async function getAccessToken (server) {
  const credentials = server.app.dynamicsClientCredentials

  const expiresOn = moment(credentials?.expiresOn)
  const now = moment()
  const minsUntilExpiry = expiresOn.diff(now, 'minutes') || 0

  if (credentials === null || minsUntilExpiry < 1) {
    try {
      const credentialsResponse = await getClientCredentialsToken()
      server.app.dynamicsClientCredentials = { accessToken: credentialsResponse.accessToken, expiresOn: credentialsResponse.expiresOn }
      return credentialsResponse.accessToken
    } catch (err) {
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

async function whoAmI (server) {
  const accessToken = await getAccessToken(server)

  try {
    const { res, payload } = await Wreck.get(apiUrl + 'WhoAmI', { json: true, headers: { Authorization: `Bearer ${accessToken}` } })

    console.log(res.statusCode)
    console.log(payload)
    return payload
  } catch (err) {
    console.error(err)
    throw err
  }
}

async function postSubmission (server, submission) {
  const accessToken = await getAccessToken(server)

  try {
    const url = `${apiUrl}cites_CreateSubmissionForPortal`

    const requestPayload = mapSubmissionToPayload(submission)

    const options = {
      json: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      payload: requestPayload
    }

    console.log(`HTTP Request Verb: POST Url: ${url}`)
    console.log('Request Payload: ' + JSON.stringify(requestPayload, null, 2))

    const { payload } = await Wreck.post(url, options)

    console.log(httpResponsePrefix + JSON.stringify(payload, null, 2))

    return payload
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

function addOdataTypeProperty (obj) {
  if (typeof obj !== 'object' || obj === null) {
    return
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, _index) => {
      addOdataTypeProperty(item)
    })
  } else {
    obj['@odata.type'] = '#Microsoft.Dynamics.CRM.expando'
    Object.values(obj).forEach(addOdataTypeProperty)
  }
}

function mapSubmissionToPayload (submission) {
  const payload = lodash.cloneDeep(submission)

  if (payload.applicant.candidateAddressData?.addressSearchData?.results) {
    payload.applicant.candidateAddressData.addressSearchData.results = null
  }

  if (payload.delivery.candidateAddressData?.addressSearchData?.results) {
    payload.delivery.candidateAddressData.addressSearchData.results = null
  }

  addOdataTypeProperty(payload)

  if (payload.supportingDocuments) {
    payload.supportingDocuments['files@odata.type'] = collectionExpandoString
  }

  if (payload.applications) {
    payload['applications@odata.type'] = collectionExpandoString
    payload.applications.forEach(application => {
      if (application.species?.uniqueIdentificationMarks) {
        application.species['uniqueIdentificationMarks@odata.type'] = collectionExpandoString
      }
    })
  }

  return { Payload: payload }
}

async function getSpecies (server, speciesName) {
  const accessToken = await getAccessToken(server)

  try {
    // const url = `${apiUrl}cites_specieses(cites_name=%27${speciesName.trim()}%27)`
    // const url = `${apiUrl}cites_specieses?$filter=(cites_name=%27${speciesName.trim()}%27%20and%20statecode%20eq%200)`//cites_specieses?$filter=(cites_name%20eq%20%27Antilocapra%20Americana%27%20and%20statecode%20eq%200)
    // const url = `${apiUrl}cites_specieses?$filter=(cites_name%20eq%20%27Antilocapra%20Americana%27%20and%20statecode%20eq%200)`

    // const test = 'antilo'
    // const url = `${apiUrl}cites_specieses?$filter=(cites_name%20eq%20%27${speciesName.trim()}%27%20and%20statecode%20eq%200)`
    const select = '$select=cites_name,cites_kingdom,cites_warningmessage,cites_restrictionsapply,statuscode,statecode'
    const filterParts = [
      `cites_name eq '${speciesName.trim()}'`,
      'statecode eq 0'
    ]
    const filter = `$filter=${filterParts.join(' and ')}`
    const top = '$top=1'
    const url = `${apiUrl}cites_specieses?${select}&${filter}&${top}`

    const options = { json: true, headers: { Authorization: `Bearer ${accessToken}` } }
    console.log(url)
    const { payload } = await Wreck.get(url, options)

    if (payload?.value?.length) {
      if (config.enableSpeciesWarning && payload.value[0].cites_warningmessage) {
        return {
          scientificName: payload.value[0].cites_name,
          kingdom: payload.value[0].cites_kingdom,
          hasRestriction: payload.value[0].cites_restrictionsapply,
          warningMessage: payload.value[0].cites_warningmessage
        }
      } else {
        return {
          scientificName: payload.value[0].cites_name,
          kingdom: payload.value[0].cites_kingdom
        }
      }
    }

    return null
  } catch (err) {
    if (err.data?.res?.statusCode === httpStatusCode.NOT_FOUND) {
      // No species match
      return null
    }

    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

async function getSpecieses (server, speciesName) {
  const accessToken = await getAccessToken(server)

  try {
    const top = '$top=15'
    const select = '$select=cites_name,cites_kingdom,cites_restrictionsapply,cites_warningmessage'
    const orderBy = '$orderby=cites_name asc'
    const count = '$count=true'

    const speciesNameSegments = speciesName.trim().split(/\s+/)
    const filterParts = speciesNameSegments.map(segment => `contains(cites_name, '${segment}') eq true`)
    filterParts.push('statecode eq 0') // Removes deactivated species

    const filter = `$filter=${filterParts.join(' and ')}`

    const url = `${apiUrl}cites_specieses?${select}&${orderBy}&${count}&${top}&${filter}`

    const options = { json: true, headers: { Authorization: `Bearer ${accessToken}` } }
    console.log(url)
    const response = await Wreck.get(url, options)

    const { payload } = response

    if (payload && payload[countString] > 0 && Array.isArray(payload.value) && payload.value.length > 0) {
      return {
        count: payload[countString],
        items: payload.value.map(formatItem)
      }
    }

    return {
      count: 0,
      items: []
    }
  } catch (err) {
    if (err.data?.res?.statusCode === httpStatusCode.NOT_FOUND) {
      // No species match
      return {
        count: 0,
        items: []
      }
    }

    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

function formatItem (item) {
  const response = {
    scientificName: item.cites_name,
    kingdom: item.cites_kingdom
  }

  if (config.enableSpeciesWarning && item.cites_warningmessage) {
    response.hasRestriction = item.cites_restrictionsapply
    response.warningMessage = item.cites_warningmessage
  }
  return response
}

async function getCountries (server) {
  const accessToken = await getAccessToken(server)

  try {
    const url = `${apiUrl}defra_countries?$select=defra_name,defra_isocodealpha2,defra_isocodealpha3&$orderby=defra_name asc`
    const options = { json: true, headers: { Authorization: `Bearer ${accessToken}` } }
    const { payload } = await Wreck.get(url, options)

    if (payload?.value) {
      return payload.value.map(country => {
        return {
          name: country.defra_name.toUpperCase(),
          code: country.defra_isocodealpha2
          // id: country.defra_countryid
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

async function getTradeTermCodes (server) {
  const accessToken = await getAccessToken(server)

  try {
    const url = `${apiUrl}cites_derivativecodes?$select=cites_name,cites_description&$orderby=cites_name asc`
    const options = { json: true, headers: { Authorization: `Bearer ${accessToken}` } }
    const { payload } = await Wreck.get(url, options)

    if (payload?.value) {
      // console.log(payload.value[0])
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

function getPortalSubmissionStatus (dynamicsStatuscode, dynamicsStatecode) {
  if (dynamicsStatecode !== 0) {
    return 'closed'
  }

  switch (dynamicsStatuscode) {
    case dynamicsStatusCodeConst.awaitingPayment:
      return 'awaitingPayment'
    case dynamicsStatusCodeConst.inProgress:
      return 'inProgress'
    case dynamicsStatusCodeConst.awaitingAdditionalPayment:
      return 'awaitingAdditionalPayment'
    default:
      return ''
  }
}

function getDynamicsSubmissionStatuses (portalStatuses) {
  const statuses = []

  if (portalStatuses.includes('awaitingPayment')) {
    statuses.push(dynamicsStatusCodeConst.awaitingPayment)
  }

  if (portalStatuses.includes('awaitingAdditionalPayment')) {
    statuses.push(dynamicsStatusCodeConst.awaitingAdditionalPayment)
  }

  if (portalStatuses.includes('inProgress')) {
    statuses.push(dynamicsStatusCodeConst.inProgress)
  }

  return statuses
}

const dynamicsPermitTypesMappings = {
  import: 149900001,
  export: 149900000,
  reexport: 149900002,
  article10: 149900003
}
// Note: It usage line already commented, hence commiting this temporary - TBC
// function reverseMapper (mapping, value) {
//   const match = Object.entries(mapping).find(x => x[1] === value)
//   return match ? match[0] : value.toString()
// }

async function getNewSubmissionsQueryUrl (contactId, organisationId, permitTypes, statuses, submittedBy, submittedByFilterEnabled, searchTerm) {
  const select = '$select=cites_submissionreference,cites_submissionmethod,statuscode,statecode,createdon'//, cites_permittype"
  const expand = '$expand=cites_cites_submission_incident_submission($select=cites_permittype;$top=1)'
  const orderby = '$orderby=createdon desc'
  const count = '$count=true'
  const filterParts = getFilterParts(submittedByFilterEnabled, submittedBy, contactId, organisationId, statuses, permitTypes)

  if (searchTerm) {
    const encodedSearchTerm = encodeURIComponent(searchTerm).replace(/'/g, '%27%27')

    const searchTermParts = [
      `cites_submissionreference eq '${encodedSearchTerm}'`,
      `cites_cites_submission_incident_submission/any(o2:(o2/cites_applicationreference eq '${encodedSearchTerm}'))`,
      `cites_cites_permit_submission_cites_submission/any(o3:(o3/cites_name eq '${encodedSearchTerm}'))`,
      `cites_cites_submission_incident_submission/any(o4:(contains(o4/cites_deliveryaddresspostcode, '${encodedSearchTerm}')))`,
      `cites_cites_submission_incident_submission/any(o5:(contains(o5/cites_partyaddresspostcode, '${encodedSearchTerm}')))`,
      `contains(cites_applicantfullname,'${encodedSearchTerm}')`
    ]
    if (config.enableInternalReference) {
      searchTermParts.push(`cites_cites_submission_incident_submission/any(o6:(o6/cites_internalreference eq '${encodedSearchTerm}'))`)
    }
    filterParts.push(`(${searchTermParts.join(' or ')})`)
  }

  const filter = `$filter=${filterParts.join(' and ')}`

  return `${apiUrl}cites_submissions?${select}&${expand}&${orderby}&${count}&${filter}`
}

function getFilterParts (submittedByFilterEnabled, submittedBy, contactId, organisationId, statuses, permitTypes) {
  const organisationIdValue = organisationId ? `'${organisationId}'` : 'null'
  const filterParts = [
    `_cites_organisation_value eq ${organisationIdValue}`,
    'cites_submissionmethod eq 149900000',
    'cites_cites_submission_incident_submission/any(o2:(o2/incidentid ne null))'
  ]

  if (!submittedByFilterEnabled || submittedBy === 'me') {
    filterParts.push(`_cites_submissionagent_value eq '${contactId}'`)
  }

  if (statuses && statuses.length > 0) {
    const statusMappedList = getDynamicsSubmissionStatuses(statuses).map(x => `'${x}'`).join(',')
    if (statuses.includes('closed')) {
      if (statusMappedList) {
        filterParts.push(`(Microsoft.Dynamics.CRM.In(PropertyName='statuscode',PropertyValues=[${statusMappedList}]) or Microsoft.Dynamics.CRM.In(PropertyName='statecode',PropertyValues=['1']))`)
      } else {
        filterParts.push('Microsoft.Dynamics.CRM.In(PropertyName=\'statecode\',PropertyValues=[\'1\'])')
      }
    } else {
      filterParts.push(`Microsoft.Dynamics.CRM.In(PropertyName='statuscode',PropertyValues=[${statusMappedList}])`)
    }
  }

  if (permitTypes && permitTypes.length > 0) {
    const permitTypeMappedList = permitTypes.map(x => `'${dynamicsPermitTypesMappings[x]}'`).join(',')
    filterParts.push(`cites_cites_submission_incident_submission/any(o1:(Microsoft.Dynamics.CRM.In(PropertyName='cites_permittype',PropertyValues=[${permitTypeMappedList}])))`)
  }
  return filterParts
}

async function getSubmissions (server, query, pageSize) {
  const accessToken = await getAccessToken(server)

  try {
    const options = { json: true, headers: { Authorization: `Bearer ${accessToken}`, Prefer: `odata.maxpagesize=${pageSize}` } }

    console.log(`HTTP Request Verb: GET Url: ${query}`)
    // log('HTTP Request - Verb: GET', { Url: query } )

    const response = await Wreck.get(query, options)

    const { payload } = response

    if (payload) {
      // log('HTTP Response Payload', payload)
      return {
        submissions: payload.value.map(x => {
          return {
            submissionRef: x.cites_submissionreference,
            status: getPortalSubmissionStatus(x.statuscode, x.statecode),
            // status: reverseMapper(dynamicsStatusMappings, x.statuscode),
            dateSubmitted: x.createdon
            // permitType: reverseMapper(dynamicsPermitTypesMappings, x.cites_cites_submission_incident_submission[0].cites_permittype)
            // permitType: 'import'
          }
        }),
        nextQueryUrl: payload['@odata.nextLink'],
        totalSubmissions: payload[countString]
      }
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

function getPaymentCalculationType (dynamicsType) {
  const dynamicsPaymentCalcTypeConst = {
    simple: 149900000,
    complex: 149900001
  }

  switch (dynamicsType) {
    case dynamicsPaymentCalcTypeConst.simple:
      return 'simple'
    case dynamicsPaymentCalcTypeConst.complex:
      return 'complex'
    default:
      throw new Error('Unknown Dynamics Payment Calculation Type.')
  }
}

function updateSubmissionSchema (jsonContent) {
  jsonContent.applications.forEach(jsonApplication => {
    // Note: Do not access Object.prototype method 'hasOwnProperty' from target object
    if ('parentDetails' in jsonApplication.species && !('maleParentDetails' in jsonApplication.species)) {
      jsonApplication.species.maleParentDetails = jsonApplication.species.parentDetails
      jsonApplication.species.femaleParentDetails = null
      delete jsonApplication.species.parentDetails
    }
  })
  return jsonContent
}

async function getSubmission (server, contactId, organisationId, submissionRef) {
  const top = '$top=1'
  const select = '$select=cites_portaljsoncontent,cites_portaljsoncontentcontinued,cites_paymentreference,cites_submissionid,cites_totalfeecalculation,cites_paymentcalculationtype,cites_feehasbeenpaid,cites_remainingadditionalamount,cites_additionalamountpaid,statuscode,statecode'
  const expand = '$expand=cites_cites_submission_incident_submission($select=cites_applicationreference,cites_permittype,statuscode,cites_portalapplicationindex)'
  const organisationIdValue = organisationId ? `'${organisationId}'` : 'null'

  const filterParts = [
    `cites_submissionreference eq '${submissionRef}'`,
    `_cites_organisation_value eq ${organisationIdValue}`
  ]

  if (contactId) {
    filterParts.push(`_cites_submissionagent_value eq '${contactId}'`)
  }

  const filter = `$filter=${filterParts.join(' and ')}`

  const url = `${apiUrl}cites_submissions?${top}&${select}&${expand}&${filter}`
  
  const accessToken = await getAccessToken(server)

  try {
    const options = { json: true, headers: { Authorization: `Bearer ${accessToken}` } }

    console.log(`HTTP Request Verb: GET Url: ${url}`)

    const response = await Wreck.get(url, options)

    const { payload } = response

    if (payload) {
      console.log(httpResponsePrefix + JSON.stringify(payload, null, 2))

      if (payload.value.length === 0) {
        throw new Error(`Submission not found with reference '${submissionRef}' and contact '${contactId}'`)
      }

      const submission = payload.value[0]
      const dynamicsApplications = payload.value[0].cites_cites_submission_incident_submission

      const jsonContent = JSON.parse((submission.cites_portaljsoncontent) + (submission.cites_portaljsoncontentcontinued || ''))
      jsonContent.submissionRef = submissionRef
      jsonContent.submissionId = submission.cites_submissionid
      jsonContent.submissionStatus = getPortalSubmissionStatus(submission.statuscode, submission.statecode)
      jsonContent.paymentDetails = {
        paymentId: submission.cites_paymentreference,
        costingType: getPaymentCalculationType(submission.cites_paymentcalculationtype),
        costingValue: submission.cites_totalfeecalculation,
        feePaid: submission.cites_feehasbeenpaid,
        remainingAdditionalAmount: submission.cites_remainingadditionalamount,
        additionalAmountPaid: submission.cites_additionalamountpaid
      }

      jsonContent.applications.forEach(jsonApplication => {
        const dynamicsApplication = dynamicsApplications.find(x => x.cites_portalapplicationindex === jsonApplication.applicationIndex)
        jsonApplication.applicationRef = dynamicsApplication?.cites_applicationreference
      })

      const updatedJsonContent = updateSubmissionSchema(jsonContent)

      return updatedJsonContent
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

async function validateSubmission (accessToken, contactId, organisationId, submissionRef, submissionId) {
  try {
    if (!submissionId && !submissionRef) {
      throw new Error('Unable to identify submission')
    }
    const top = '$top=1'
    const select = '$select=cites_submissionreference'
    const organisationIdValue = organisationId ? `'${organisationId}'` : 'null'

    const filterParts = [
      `$filter=_cites_organisation_value eq ${organisationIdValue}`
    ]

    if (contactId) {
      filterParts.push(`_cites_submissionagent_value eq '${contactId}'`)
    }

    if (submissionRef) {
      filterParts.push(`cites_submissionreference eq '${submissionRef}'`)
    }
    if (submissionId) {
      filterParts.push(`cites_submissionid eq '${submissionId}'`)
    }

    const url = `${apiUrl}cites_submissions?${top}&${select}&${filterParts.join(' and ')}`

    const options = { json: true, headers: { Authorization: `Bearer ${accessToken}` } }

    console.log(`HTTP Request Verb: GET Url: ${url}`)

    const { payload } = await Wreck.get(url, options)

    if (payload) {
      console.log(httpResponsePrefix + JSON.stringify(payload, null, 2))

      if (payload.value.length === 0) {
        throw new Error(`Submission not found with details submisssionRef: '${submissionRef}', submissionId: '${submissionId}', contactId: '${contactId}', organisationId: '${organisationId}'`)
      }
    }
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

async function setSubmissionPayment (params) {
  const accessToken = await getAccessToken(params.server)
  await validateSubmission(accessToken, params.contactId, params.organisationId, null, params.submissionId)// Not necessary as we are using submissionId which is server side

  try {
    const url = `${apiUrl}cites_submissions(${params.submissionId})`

    const requestPayload = {
      statuscode: 149900002
    }

    if (params.isAdditionalPayment) {
      requestPayload.cites_additionalpaymentmethod = 149900000 // Gov Pay
      requestPayload.cites_additionalpaymentreference = params.paymentRef
      requestPayload.cites_additionalamountpaid = params.paymentValue + params.previousAdditionalAmountPaid
    } else {
      requestPayload.cites_paymentmethod = 149900000 // Gov Pay
      requestPayload.cites_paymentreference = params.paymentRef
      requestPayload.cites_totalfeeamount = params.paymentValue
    }

    const options = {
      json: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      payload: requestPayload
    }
    console.log(`HTTP Request Verb: PATCH Url: ${url}`)
    console.log('Request Payload: ' + JSON.stringify(requestPayload, null, 2))

    const { payload } = await Wreck.patch(url, options)

    console.log(httpResponsePrefix + JSON.stringify(payload, null, 2))
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

async function setPaymentReference (params) {
  const accessToken = await getAccessToken(params.server)
  await validateSubmission(accessToken, params.contactId, params.organisationId, null, params.submissionId)// Not necessary as we are using submissionId which is server side

  try {
    const url = `${apiUrl}cites_submissions(${params.submissionId})`

    // For status codes please refer to dynamicsStatusCodeConst in start of this file.
    let requestPayload = {
      statuscode: dynamicsStatusCodeConst.awaitingPayment
    }

    if (params.isAdditionalPayment) {
      // requestPayload
      requestPayload.cites_additionalpaymentmethod = 149900000 // Gov Pay
      requestPayload.cites_additionalpaymentreference = params.paymentRef
      requestPayload.cites_additionalamountpaid = params.paymentValue + params.previousAdditionalAmountPaid
    } else {
      requestPayload.cites_paymentmethod = 149900000 // Gov Pay
      requestPayload.cites_paymentreference = params.paymentRef
      requestPayload.cites_totalfeeamount = params.paymentValue
    }

    const options = {
      json: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      payload: requestPayload
    }
    console.log(`[PAYMENT-ID] HTTP Request Verb: PATCH Url: ${url}`)
    console.log('[PAYMENT-ID] Request Payload: ' + JSON.stringify(requestPayload, null, 2))

    const { payload } = await Wreck.patch(url, options)

    console.log(httpResponsePrefix + JSON.stringify(payload, null, 2))
  } catch (err) {
    if (err.data?.payload) {
      console.error(err.data.payload)
    }
    console.error(err)
    throw err
  }
}

module.exports = { getAccessToken, whoAmI, getSpecies, getSpecieses, getSubmissions, getNewSubmissionsQueryUrl, postSubmission, getCountries, getTradeTermCodes, getSubmission, setSubmissionPayment, setPaymentReference }
