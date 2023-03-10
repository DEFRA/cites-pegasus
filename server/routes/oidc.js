const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'oidc'
//const Joi = require('joi')
const { client } = require('../services/oidc-client')

async function getAuthorizationUri() {
  const authorizationUri = await client.authorizationUrl({
    scope: 'openid profile email',
    redirect_uri: 'http://localhost:3000/callback',
    response_type: 'code',
  });
  return authorizationUri;
}

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
        'http://localhost:3000/callback',
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
    handler: async (request, h) => {
      const authorizationUri = await getAuthorizationUri();
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