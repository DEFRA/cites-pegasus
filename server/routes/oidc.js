const config = require('../../config/config')
const pageId = 'oidc'
//const Joi = require('joi')
const { getYarValue, setYarValue, clearYarSession } = require('../lib/session')
const { getDomain } = require('../lib/helper-functions')
const { getOpenIdClient } = require('../services/oidc-client')
const { cidmCallbackUrl, postLogoutRedirectUrl, postAccountManagementUrl } = require('../../config/config')

const { readSecret } = require('../lib/key-vault')
const jwt = require('jsonwebtoken');
const landingPage = '/my-submissions'

function getRelationshipDetails(user) {
  const relationshipDetails = {    
    organisationId: null,
    organisationName: null,
    userType: null
  }

  if (user.relationships && user.relationships.length === 1) {
    const parts = user.relationships[0].split(':')
    if (parts.length >= 5) {
      relationshipDetails.organisationId = parts[1]
      relationshipDetails.organisationName = parts[2]
      relationshipDetails.userType = parts[4]
    }
  }
  
  return relationshipDetails
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
      const params = await oidcClient.callbackParams(request.raw.req);

      const tokenSet = await oidcClient.callback(
        cidmCallbackUrl,
        params
      );

      const user = tokenSet.claims();//Retrieve the user details from the CIDM jww token
      console.log(`User logged in: ${user.firstName} ${user.lastName} (${user.email})`)

      const sessionCIDMAuth = getYarValue(request, 'CIDMAuth')
      if(sessionCIDMAuth && user.contactId !== sessionCIDMAuth?.user.contactId) {
        //A different user has signed in successfully so clear the previous users session
        clearYarSession(request)
      }

      const relationshipDetails = getRelationshipDetails(user)
      setYarValue(request, 'CIDMAuth', { idToken: tokenSet.id_token, user: { ...user, ...relationshipDetails } })

      const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value
      const token = jwt.sign({ contactId: user.contactId }, secret, { algorithm: 'HS256' })
      //const token = jwt.sign({ contactId: user.contactId }, secret.value, { algorithm: 'HS256', expiresIn: "1h" })

      const stateOptions = {
        // ttl: 60 * 60 * 1000, // Cookie expiration time, for example, 1 hour
        // path: '/', // The cookie will be accessible from any path
        // isSecure: true, //process.env.NODE_ENV === 'production', // Set to true in production, false in development
        // isHttpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        // encoding: 'base64json' // 'none' =  Do not encode the cookie value
        sameSite: 'Strict' // The cookie will be sent only on the same site, preventing CSRF attacks
      }

      h.state('token', token, stateOptions)//Store the token in a cookie called token
      //The token stored in the cookie will not be available on the first page after login if we redirect to it at this stage.
      //So we are instead returning a page which will cause the browser to perform the redirect instead

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
        response_type: 'code',//id_token
        redirect_uri: cidmCallbackUrl,
        serviceId: serviceId
      }
      const oidcClient = request.server.app.oidcClient
      //const oidcClient = await getOpenIdClient()      
      const authorizationUri = oidcClient.authorizationUrl(authOptions)

      return h.redirect(authorizationUri);
    },
  },
  {
    method: 'GET',
    path: '/logout',
    config: {
      auth: false
    },
    handler: async (request, h) => {
      const oidcClient = request.server.app.oidcClient

      const cidmAuth = getYarValue(request, 'CIDMAuth')
      const endSessionParams = {
        id_token_hint: cidmAuth?.idToken || null,
        post_logout_redirect_uri: postLogoutRedirectUrl        
      }

      const logoutUri = oidcClient.endSessionUrl(endSessionParams)

      clearYarSession(request)
      return h.redirect(logoutUri).unstate('token').unstate('session');
    },
  },
  {
    method: 'GET',
    path: '/account-management',
    config: {
      auth: false
    },
    handler: async (request, h) => {

      clearYarSession(request)
      return h.redirect(postAccountManagementUrl).unstate('session');
    },
  },
  {
    method: 'GET',
    path: '/auto-login',
    config: {
      auth: false
    },
    handler: async (request, h) => {
      if ( config.env === 'prod' || config.env === 'production' || config.env === 'live') {
        return h.response().code(403)
      }

      const user = {
        exp: 1679568438,
        nbf: 1679567238,
        ver: "1.0",
        iss: "https://azdcuspoc5.b2clogin.com/64c9d4f5-a560-4b65-9004-6d1e5ccee51d/v2.0/",
        sub: "510080e3-d07a-4485-8189-ca620a1cb734",
        aud: "f566829d-3826-4ec7-9af9-e1229c5f6c25",
        acr: "b2c_1a_signupsignin",
        iat: 1679567238,
        auth_time: 1679567236,
        aal: "1",
        serviceId: "8d13a162-ed6b-ed11-9561-000d3adeabd5",
        correlationId: "809e9fe6-f074-4fc3-bbf8-f463d4212c0d",
        currentRelationshipId: "3dd519d3-64c9-ed11-b597-6045bd8d15ff",
        sessionId: "c10a5171-df2d-4911-840a-3f588572ca6b",
        email: "tester@testing.com",
        contactId: "645c1acd-64c9-ed11-b597-6045bd8d15ff",
        firstName: "Bob",
        lastName: "Tester",
        uniqueReference: "BA202356-N4-2303-K4-2310",
        loa: 0,
        enrolmentCount: 0,
        enrolmentRequestCount: 1,
        relationships: [
          "3dd519d3-64c9-ed11-b597-6045bd8d15ff:abd419d3-64c9-ed11-b597-6045bd8d15ff:Testing Co::Employee:",
        ],
        roles: [
        ],
      }

      const sessionCIDMAuth = getYarValue(request, 'CIDMAuth')
      if(sessionCIDMAuth && user.contactId !== sessionCIDMAuth?.user.contactId) {
        //A different user has signed in successfully so clear the previous users session
        clearYarSession(request)
      }

      const relationshipDetails = getRelationshipDetails(user)
      setYarValue(request, 'CIDMAuth', { idToken: 'abc123', user: { ...user, ...relationshipDetails } })

      const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value
      const token = jwt.sign({ contactId: user.contactId }, secret, { algorithm: 'HS256' })
      //const token = jwt.sign({ contactId: user.contactId }, secret.value, { algorithm: 'HS256', expiresIn: "1h" })

      const stateOptions = {
        sameSite: 'Strict' // The cookie will be sent only on the same site, preventing CSRF attacks
      }

      h.state('token', token, stateOptions)//Store the token in a cookie called token
      
      //The token stored in the cookie will not be available on the first page after login if we redirect to it at this stage.
      //So we are instead returning a page which will cause the browser to perform the redirect instead
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