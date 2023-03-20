const jwtAuth = require('hapi-auth-jwt2');
const jwksClient = require('jwks-rsa');
const { decode } = require('jsonwebtoken');
const { client } = require('../services/oidc-client')
const { readSecret } = require('../lib/key-vault')
const { getYarValue } = require('../lib/session')

module.exports = {
  plugin: {
    name: 'oidc-auth',
    register: async (server, options) => {

      await server.register(jwtAuth)

      const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value

      const authOptions = {
        key: secret,
        validate: async (decoded, request, h) => {
          const auth = getYarValue(request, 'CIDMAuth')

          if (decoded.userSub === auth?.user.sub) {
            return { isValid: true, credentials: { user: decoded.user } }
          } else {
            return { isValid: false }
          }

          //TODO:  Validate the token
          // const kid = decode(decoded.token).header.kid;
          // const key = await client.getSigningKeyAsync(kid);
          // const secret = key.publicKey || key.rsaPublicKey;

          // return { isValid: true, credentials: { user: decoded.user } };


        },
        verifyOptions: { algorithms: ['HS256'] },
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