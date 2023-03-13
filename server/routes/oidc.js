const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'oidc'
const openid = require('openid-client');
//const Joi = require('joi')
const { getOpenIdClient, oidcClient } = require('../services/oidc-client')

// let client

// (async function createOpenIdClient() {
  
//   openid.custom.setHttpOptionsDefaults({
//     timeout: 10000,
//   });
//   const issuer = await openid.Issuer.discover('https://condev5.azure.defra.cloud/idphub/b2c/b2c_1a_signupsignin/.well-known/openid-configuration');
//   const clientCredentials = {
//     client_id: 'f566829d-3826-4ec7-9af9-e1229c5f6c25',
//     client_secret: 'bVQ8Q~8tDWwLk4sP6FPWmNnXQn4C6NTgjgH3fda7',
//     redirect_uris: ['https://wa-cites-application.azurewebsites.net/oidc'],
//   };
  
//   client = new issuer.Client(clientCredentials);
  
//   //return client
// })()

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


      //await createOpenIdClient()
      //const authorizationUri = await getAuthorizationUri();
      //let client = await createOpenIdClient()
      
      //const authorizationUri = await client.authorizationUrl(authOptions);
    
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