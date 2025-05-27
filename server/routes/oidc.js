const config = require('../../config/config')
const { getYarValue, setYarValue, clearYarSession, sessionKey } = require('../lib/session')
const { httpStatusCode } = require('../lib/constants')
const { urlPrefix } = require('../../config/config')
// Not in use - TBC
// const { getOpenIdClient } = require('../services/oidc-client')
const { cidmCallbackUrl, cidmPostLogoutRedirectUrl, cidmAccountManagementUrl } = require('../../config/config')
const user = require('../lib/user')
const { readSecret } = require('../lib/key-vault')
const jwt = require('jsonwebtoken')
const { setSubmissionPayment,setPaymentReference } = require('../services/dynamics-service')
const { getPaymentStatus } = require('../services/govpay-service')
const { getSubmission, mergeSubmission } = require('../lib/submission')
const landingPage = '/my-submissions'
const nextPathFailed = `${urlPrefix}/payment-problem`
const relationshipsParts = {
  organisationId: 1,
  organisationName: 2,
  userType: 4
}
const roleParts = {
  serviceRole: 1
}
const relationshipMinParts = 5
const roleMinParts = 3
const pageId = 'govpay'
const invalidSubmissionPath = `${urlPrefix}/`

function getRelationshipDetails (user) {
  const relationshipDetails = {
    organisationId: null,
    organisationName: null,
    userType: null
  }

  if (user.relationships && user.relationships.length === 1) {
    const parts = user.relationships[0].split(':')
    if (parts.length >= relationshipMinParts) {
      relationshipDetails.organisationId = parts[relationshipsParts.organisationId]
      relationshipDetails.organisationName = parts[relationshipsParts.organisationName]
      relationshipDetails.userType = parts[relationshipsParts.userType]
    }
  }

  return relationshipDetails
}

function getRoleDetails (user) {
  const roleDetails = {
    serviceRole: null
  }

  if (user.roles && user.roles.length === 1) {
    const parts = user.roles[0].split(':')
    if (parts.length >= roleMinParts) {
      roleDetails.serviceRole = parts[roleParts.serviceRole]
    }
  }

  return roleDetails
}

async function getFinishedPaymentStatus (paymentId) {
  const timeoutMs = 60000 // 1 minute timeout
  const intervalMs = 2000 // 2 seconds interval

  const startTimestamp = Date.now()

  while (true) {
    const statusResponse = await getPaymentStatus(paymentId)
    console.log(statusResponse.status)

    if (statusResponse.finished) {
      return statusResponse
    }

    const elapsedMs = Date.now() - startTimestamp

    if (elapsedMs >= timeoutMs) {
      console.log('Timeout reached getting payment status')
      return statusResponse
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}

async function checkLastPermit (request,h,htmlContent) {
  // take submission from cookies
  // use paymentId and check the status of last permit
  let submission = getSubmission(request)
  console.log("submission after re login: ",await submission);

  const paymentId = submission.paymentDetails.paymentId
  const previousAdditionalAmountPaid = submission.paymentDetails.additionalAmountPaid
  const isAdditionalPayment = submission.paymentDetails.remainingAdditionalAmount > 0

  const paymentStatus = await getFinishedPaymentStatus(paymentId)
  console.log('Received paymentStatus:', paymentStatus);

  submission.paymentDetails.paymentStatus = paymentStatus

  try {
    mergeSubmission(request, { paymentDetails: submission.paymentDetails }, `${pageId}`)
  } catch (err) {
    console.error(err)
    return h.redirect(invalidSubmissionPath)
  }
  const paymentRoute = getYarValue(request, 'govpay-paymentRoute')
  console.log('Retrieved paymentRoute:', paymentRoute);

  if (paymentStatus.status !== 'success' || paymentStatus.finished === false) {
    return h.redirect(`${nextPathFailed}/${paymentRoute}`)// need to handkle this how to get paymentRoute
    // why need to show user that session has been lost 
    // if cancel payment I think they should be redirected to home page.    
  }

  let contactIdFilter = submission.contactId
  if (user.hasOrganisationWideAccess(request)) {
    contactIdFilter = null
  }

  const submissionPaymentParams = {
    server: request.server,
    contactId: contactIdFilter,
    organisationId: submission.organisationId,
    submissionId: submission.submissionId,
    paymentRef: paymentStatus.paymentId,
    paymentValue: paymentStatus.amount / 100,
    isAdditionalPayment,
    previousAdditionalAmountPaid
  }
  // await setSubmissionPayment(submissionPaymentParams)
  await setPaymentReference(submissionPaymentParams)
}

module.exports = [
  {
    method: 'GET',
    path: '/callback',
    config: {
      auth: false
    },
    handler: async (request, h) => {
      const oidcClient = request.server.app.oidcClient
      const params = await oidcClient.callbackParams(request.raw.req)

      if (!params.code) {
        // This is most likely a redirect from CIDM account management rather than a login request
        return h.redirect('/')
      }

      const tokenSet = await oidcClient.callback(
        cidmCallbackUrl,
        params
      )

      const user = tokenSet.claims()// Retrieve the user details from the CIDM jww token
      console.log(`User logged in: ${user.firstName} ${user.lastName} (${user.email})`)

      const sessionCIDMAuth = getYarValue(request, sessionKey.CIDM_AUTH)
      if (sessionCIDMAuth && user.contactId !== sessionCIDMAuth?.user.contactId) {
        // A different user has signed in successfully so clear the previous users session
        clearYarSession(request)
      }

      const userstring = JSON.stringify(user)
      console.log('User details:')
      console.log(userstring)

      const relationshipDetails = getRelationshipDetails(user)
      const roleDetails = getRoleDetails(user)

      setYarValue(request, sessionKey.CIDM_AUTH, { idToken: tokenSet.id_token, user: { ...user, ...relationshipDetails, ...roleDetails } })

      const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value
      const token = jwt.sign({ contactId: user.contactId }, secret, { algorithm: 'HS256' })
      // const token = jwt.sign({ contactId: user.contactId }, secret.value, { algorithm: 'HS256', expiresIn: "1h" })

      const stateOptions = {
        // ttl: 60 * 60 * 1000, // Cookie expiration time, for example, 1 hour
        // path: '/', // The cookie will be accessible from any path
        // isSecure: true, //process.env.NODE_ENV === 'production', // Set to true in production, false in development
        // isHttpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        // encoding: 'base64json' // 'none' =  Do not encode the cookie value
        sameSite: 'Strict' // The cookie will be sent only on the same site, preventing CSRF attacks
      }

      h.state('token', token, stateOptions)// Store the token in a cookie called token
      // The token stored in the cookie will not be available on the first page after login if we redirect to it at this stage.
      // So we are instead returning a page which will cause the browser to perform the redirect instead

      const sessionLost = getYarValue(request, sessionKey.SESSION_LOST)

      const htmlContent = `<!DOCTYPE html>
                            <html>
                              <head>
                                <meta http-equiv="refresh" content="0; URL='${landingPage}'" />
                              </head>
                              <body>
                              </body>
                            </html>`

      if(sessionLost){
        console.log("sessionLost",sessionLost);
        await checkLastPermit(request,h,htmlContent)
      }
      
      return h.response(htmlContent).header('Content-Type', 'text/html')
    }
  },
  {
    method: 'GET',
    path: '/login',
    config: {
      auth: false
    },
    handler: async (request, h) => {
      const serviceId = (await readSecret('CIDM-API-SERVICE-ID')).value
      const authOptions = {
        scope: 'openid email profile',
        response_type: 'code', // id_token
        redirect_uri: cidmCallbackUrl,
        serviceId: serviceId
      }
      const oidcClient = request.server.app.oidcClient
      // const oidcClient = await getOpenIdClient()
      const authorizationUri = oidcClient.authorizationUrl(authOptions)

      return h.redirect(authorizationUri)
    }
  },
  {
    method: 'GET',
    path: '/logout',
    config: {
      auth: false
    },
    handler: async (request, h) => {
      const oidcClient = request.server.app.oidcClient

      const cidmAuth = getYarValue(request, sessionKey.CIDM_AUTH)
      const endSessionParams = {
        id_token_hint: cidmAuth?.idToken || null,
        post_logout_redirect_uri: cidmPostLogoutRedirectUrl
      }

      const logoutUri = oidcClient.endSessionUrl(endSessionParams)

      clearYarSession(request)
      return h.redirect(logoutUri).unstate('token').unstate('session')
    }
  },
  {
    method: 'GET',
    path: '/account-management',
    config: {
      auth: false
    },
    handler: async (request, h) => {
      clearYarSession(request)
      return h.redirect(cidmAccountManagementUrl).unstate('session')
    }
  },
  {
    method: 'GET',
    path: '/auto-login',
    config: {
      auth: false
    },
    handler: async (request, h) => {
      if (config.env === 'prod' || config.env === 'production' || config.env === 'live') {
        return h.response().code(httpStatusCode.FORBIDDEN)
      }

      const user = {
        exp: 1679568438,
        nbf: 1679567238,
        ver: '1.0',
        iss: 'https://azdcuspoc5.b2clogin.com/64c9d4f5-a560-4b65-9004-6d1e5ccee51d/v2.0/',
        sub: '510080e3-d07a-4485-8189-ca620a1cb734',
        aud: 'f566829d-3826-4ec7-9af9-e1229c5f6c25',
        acr: 'b2c_1a_signupsignin',
        iat: 1679567238,
        auth_time: 1679567236,
        aal: '1',
        serviceId: '8d13a162-ed6b-ed11-9561-000d3adeabd5',
        correlationId: '809e9fe6-f074-4fc3-bbf8-f463d4212c0d',
        currentRelationshipId: '3dd519d3-64c9-ed11-b597-6045bd8d15ff',
        sessionId: 'c10a5171-df2d-4911-840a-3f588572ca6b',
        email: 'tester@testing.com',
        contactId: '645c1acd-64c9-ed11-b597-6045bd8d15ff',
        firstName: 'Bob',
        lastName: 'Tester',
        uniqueReference: 'BA202356-N4-2303-K4-2310',
        loa: 0,
        enrolmentCount: 0,
        enrolmentRequestCount: 1,
        relationships: [
          '3dd519d3-64c9-ed11-b597-6045bd8d15ff:abd419d3-64c9-ed11-b597-6045bd8d15ff:Testing Co::Employee:'
        ],
        roles: [
        ]
      }

      const sessionCIDMAuth = getYarValue(request, sessionKey.CIDM_AUTH)
      if (sessionCIDMAuth && user.contactId !== sessionCIDMAuth?.user.contactId) {
        // A different user has signed in successfully so clear the previous users session
        clearYarSession(request)
      }

      const relationshipDetails = getRelationshipDetails(user)
      setYarValue(request, sessionKey.CIDM_AUTH, { idToken: 'abc123', user: { ...user, ...relationshipDetails } })

      const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value
      const token = jwt.sign({ contactId: user.contactId }, secret, { algorithm: 'HS256' })
      // const token = jwt.sign({ contactId: user.contactId }, secret.value, { algorithm: 'HS256', expiresIn: "1h" })

      const stateOptions = {
        sameSite: 'Strict' // The cookie will be sent only on the same site, preventing CSRF attacks
      }

      h.state('token', token, stateOptions)// Store the token in a cookie called token

      // The token stored in the cookie will not be available on the first page after login if we redirect to it at this stage.
      // So we are instead returning a page which will cause the browser to perform the redirect instead
      const htmlContent = `<!DOCTYPE html>
                            <html>
                              <head>
                                <meta http-equiv="refresh" content="0; URL='${landingPage}'" />
                              </head>
                              <body>
                              </body>
                            </html>`

      return h.response(htmlContent).header('Content-Type', 'text/html')
    }
  }
]
