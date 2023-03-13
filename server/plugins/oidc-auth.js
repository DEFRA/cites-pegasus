const jwtAuth = require('hapi-auth-jwt2');
const jwksClient = require('jwks-rsa');
const { decode } = require('jsonwebtoken');
const { client } = require('../services/oidc-client')


async function validate(decoded, request) {
  const key = await client.getSigningKeyAsync(kid);
  const secret = key.publicKey || key.rsaPublicKey;
  return { isValid: true, credentials: { user: decoded.sub } };
}



module.exports = {
  plugin: {
    name: 'oidc-auth',
    register: (server, options) => {

      server.register(jwtAuth)

      const authOptions = {
        key: 'bVQ8Q~8tDWwLk4sP6FPWmNnXQn4C6NTgjgH3fda7',
        validate,
        verifyOptions: { algorithms: ['RS256'] },
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