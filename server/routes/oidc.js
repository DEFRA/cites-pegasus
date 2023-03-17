const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'oidc'
//const Joi = require('joi')
const { getOpenIdClient } = require('../services/oidc-client')
const { readSecret } = require('../lib/key-vault')
const jwt = require('jsonwebtoken');

// async function getAuthorizationUri() {
//   const authorizationUri = await client.authorizationUrl({
//     scope: 'openid profile email',
//     redirect_uri: 'https://localhost:3000/callback',
//     response_type: 'code',
//   });
//   return authorizationUri;
// }

module.exports = [
  // {
  //   method: 'GET',
  //   path: `${urlPrefix}/${pageId}`,
  //   handler: async (request, h) => {
  //     return h.view(pageId, null);
  //   }
  // },
  {
    method: 'GET',
    path: '/callback',
    config: {
      auth: false // authentication is not required
    },
    handler: async (request, h) => {
      const oidcClient = await getOpenIdClient()
      const params = await oidcClient.callbackParams(request.raw.req);
      const tokenSet = await oidcClient.callback(
        'https://localhost:3000/callback',
        params,
        { code_verifier: 'your-code-verifier' }
      );
      const user = tokenSet.claims();
//or
      //const user2 = await oidcClient.userinfo(tokenSet);
      const clientSecret = await readSecret('CIDM-API-CLIENT-SECRET')//TODO Is there a better value to use than this?  Needs to match the value used in the authOptions in server/plugins/oidc-auth.js
      const token = jwt.sign({ user: user }, clientSecret.value)
      console.log(user)

      return h.response().state('token', token).redirect('/permit-type');      
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
        redirect_uri: 'https://localhost:3000/callback',
        serviceId: serviceId
      }

      const oidcClient = await getOpenIdClient()      
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
      const oidcClient = await getOpenIdClient() 
      const logoutUri = oidcClient.endSessionUrl({
        id_token_hint: request.state.token,
        post_logout_redirect_uri: 'https://localhost:3000',
      });
      return h.response().unstate('token').unstate('session').redirect('/');   
      //return h.redirect(logoutUri).unstate('token').unstate('session');
    },
  }
]