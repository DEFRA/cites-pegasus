const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'oidc'
//const Joi = require('joi')
const { getYarValue, setYarValue } = require('../lib/session')
const { getDomain } = require('../lib/helper-functions')
const { getOpenIdClient } = require('../services/oidc-client')
const { cidmCallbackUrl } = require('../../config/config')
const { readSecret } = require('../lib/key-vault')
const jwt = require('jsonwebtoken');


module.exports = [
  {
    method: 'GET',
    path: '/callback',
    config: {
      auth: false // authentication is not required
    },
    handler: async (request, h) => {
      const oidcClient = request.server.app.oidcClient
      const params = await oidcClient.callbackParams(request.raw.req);
      
      const tokenSet = await oidcClient.callback(
        cidmCallbackUrl,
        params,
        { code_verifier: 'your-code-verifier' }
      );

      //const userDetails = oidcClient.userinfo(tokenSet);//THIS IS NOT CONFIGURED ON THE ISSUERS ENDPOINT
      const user = tokenSet.claims();
      console.log(`User logged in: ${user.firstName} ${user.lastName} (${user.email}) - subject: ${user.sub}`)

      setYarValue(request, 'CIDMAuth', { idToken: tokenSet.id_token, user: user })

      const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value
      const token = jwt.sign({ userSub: user.sub }, secret, { algorithm: 'HS256' })
      //const token = jwt.sign({ user: user }, secret.value, { algorithm: 'HS256', expiresIn: "1h" })

      const stateOptions = {
        // ttl: 60 * 60 * 1000, // Cookie expiration time, for example, 1 hour
        // path: '/', // The cookie will be accessible from any path
        // isSecure: true, //process.env.NODE_ENV === 'production', // Set to true in production, false in development
        // isHttpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        // encoding: 'none', // Do not encode the cookie value
        sameSite: 'Strict' // The cookie will be sent only on the same site, preventing CSRF attacks
      }

      h.state('token', token, stateOptions)
      return h.redirect('/permit-type?token=' + token)//TODO Shouldn't need to pass the token as a query param but can't get the cookie to work for this first page after login
      //return h.redirect('/permit-type')//.state('token', token, stateOptions)
    }
  },
  {
    method: 'GET',
    path: '/login',
    config: {
      auth: false // authentication is not required
    },
    handler: async (request, h) => {
      const serviceId = (await readSecret('CIDM-API-SERVICE-ID')).value
      const authOptions = {
        scope: 'openid email profile',
        response_type: 'code',
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
      auth: false // authentication is not required
    },
    handler: async (request, h) => {
      const oidcClient = request.server.app.oidcClient
      //const oidcClient = await getOpenIdClient() 
      // const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value
      // const decodedToken = jwt.verify(request.state.token, secret);
      //const id_token = reques

      const auth = getYarValue(request, 'CIDMAuth')
      const endSessionParams = {
        id_token_hint: auth?.idToken || null
        //post_logout_redirect_uri: 'https://localhost:3000',
      }

      const logoutUri = oidcClient.endSessionUrl(endSessionParams)
      //TODO Clear session data
      return h.redirect(logoutUri).unstate('token').unstate('session');
    },
  }
]