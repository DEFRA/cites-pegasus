const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'oidc'
//const Joi = require('joi')
const { getOpenIdClient } = require('../services/oidc-client')

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
      const user = tokenSet.claims().sub;
      return h.redirect('/profile').state('token', tokenSet.access_token);
    }
  },
  {
    method: 'GET',
    path: '/login',
    config: {
      auth: false // authentication is not required
    },
    handler: async (request, h) => {
      const authOptions = {
        scope: 'openid email profile',
        response_type: 'code',
        redirect_uri: 'https://localhost:3000/callback',
        serviceId: '8d13a162-ed6b-ed11-9561-000d3adeabd5'
      }

      const oidcClient = await getOpenIdClient()      
      const authorizationUri = oidcClient.authorizationUrl(authOptions)

      return h.redirect(authorizationUri);
    },
  },
  {
    method: 'GET',
    path: '/logout',
    handler: (request, h) => {
      const logoutUri = client.endSessionUrl({
        id_token_hint: request.state.token,
        post_logout_redirect_uri: 'https://localhost:3000',
      });
      return h.redirect(logoutUri).unstate('token');
    },
  }
]