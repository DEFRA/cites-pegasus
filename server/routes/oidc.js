const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'oidc'
//const Joi = require('joi')
const { getYarValue, setYarValue, clearYarSession } = require('../lib/session')
const { getDomain } = require('../lib/helper-functions')
const { getOpenIdClient } = require('../services/oidc-client')
const { cidmCallbackUrl, postLogoutRedirectUrl } = require('../../config/config')
const { readSecret } = require('../lib/key-vault')
const jwt = require('jsonwebtoken');

function getRelationshipDetails(user) {
  const relationshipDetails = {
    organisation: null,
    userType: null
  }

  if (user.relationships && user.relationships.length === 1) {
    const parts = user.relationships[0].split(':')
    if (parts.length >= 5) {
      relationshipDetails.organisation = parts[2]
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
                                <meta http-equiv="refresh" content="0; URL='/permit-type'" />
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
        post_logout_redirect_uri: postLogoutRedirectUrl,
      }

      const logoutUri = oidcClient.endSessionUrl(endSessionParams)

      clearYarSession(request)
      return h.redirect(logoutUri).unstate('token').unstate('session');
    },
  }
]