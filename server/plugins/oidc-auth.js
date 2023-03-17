const jwtAuth = require('hapi-auth-jwt2');
const jwksClient = require('jwks-rsa');
const { decode } = require('jsonwebtoken');
const { client } = require('../services/oidc-client')
const { readSecret } = require('../lib/key-vault')

module.exports = {
  plugin: {
    name: 'oidc-auth',
    register: async (server, options) => {

      server.register(jwtAuth)

      const clientSecret = await readSecret('CIDM-API-CLIENT-SECRET')//TODO Is there a better value to use than this?  Needs to match the value used in oidc.js callback handler

      const authOptions = {
        key: clientSecret.value,
        validate: async (decoded, request, h) => {
          //TODO:  Validate the token
          // const kid = decode(decoded.token).header.kid;
          // const key = await client.getSigningKeyAsync(kid);
          // const secret = key.publicKey || key.rsaPublicKey;

          // return { isValid: true, credentials: { user: decoded.user } };
          return { isValid: true };

        }
        //validate
        //verifyOptions: { algorithms: ['RS256'] },
      };

      server.auth.strategy('jwt', 'jwt', authOptions);
      server.auth.default('jwt');

      server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        if (response.isBoom && response.output.statusCode === 401) {
          return h.redirect('/login');
        }
        return h.continue;
      });
    }
  }
}