const jwtAuth = require('hapi-auth-jwt2');
const jwksClient = require('jwks-rsa');
const { decode } = require('jsonwebtoken');
const { client } = require('../services/oidc-client')
const { readSecret } = require('../lib/key-vault')
const { getYarValue, sessionKey } = require('../lib/session')
const { httpStatusCode } = require('../lib/constants')

module.exports = {
  plugin: {
    name: 'oidc-auth',
    register: async (server, _options) => {

      await server.register(jwtAuth)

      const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value

      const authOptions = {
        key: secret,
        validate: async (decoded, request, _h) => {
          const sessionCIDMAuth = getYarValue(request, sessionKey.CIDM_AUTH)

          if (decoded.contactId === sessionCIDMAuth?.user.contactId) {
            return { isValid: true, credentials: { contactId: decoded.contactId } }
          } else {
            return { isValid: false }
          }

        },
        verifyOptions: { algorithms: ['HS256'] },
      };

      server.auth.strategy('jwt', 'jwt', authOptions);
      server.auth.default('jwt');

      server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        if (response.isBoom && response.output.statusCode === httpStatusCode.UNAUTHORIZED) {
          return h.redirect('/login');
        }
        return h.continue;
      });
    }
  }
}