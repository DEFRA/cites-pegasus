const jwtAuth = require('hapi-auth-jwt2');
const jwksClient = require('jwks-rsa');
const { decode } = require('jsonwebtoken');
const { client } = require('../services/oidc-client')
const { readSecret } = require('../lib/key-vault')
const { getYarValue, setYarValue } = require('../lib/session')

module.exports = {
  plugin: {
    name: 'oidc-auth',
    register: async (server, options) => {

      await server.register(jwtAuth)

      const secret = (await readSecret('SESSION-COOKIE-PASSWORD')).value

      const authOptions = {
        key: secret,
        validate: async (decoded, request, h) => {
          const sessionCIDMAuth = getYarValue(request, 'CIDMAuth')

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
        if (response.isBoom && response.output.statusCode === 401) {
          return h.redirect('/login');
        }
        return h.continue;
      });
    }
  }
}