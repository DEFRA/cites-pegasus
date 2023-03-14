const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'oidc'
const openid = require('openid-client');
//const Joi = require('joi')
const { getOpenIdClient } = require('../services/oidc-client')

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
    handler: async (request, h) => {
      const params = await client.callbackParams(request.raw.req);
      const tokenSet = await client.callback(
        'https://wa-cites-application.azurewebsites.net/oidc',
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
        redirect_uri: 'https://wa-cites-application.azurewebsites.net/oidc'
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
        post_logout_redirect_uri: 'http://localhost:3000',
      });
      return h.redirect(logoutUri).unstate('token');
    },
  }
]