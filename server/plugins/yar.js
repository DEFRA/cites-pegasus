const config = require('../../config/config')
const { readSecret } = require('../lib/key-vault')

module.exports = {
  name: 'yar',
  register: async function (server, _options) {
    const cookiePassword = (await readSecret('SESSION-COOKIE-PASSWORD')).value

    server.register({
      plugin: require('@hapi/yar'),
      options: {
        maxCookieSize: config.useRedis ? 0 : 1024,
        storeBlank: true,
        cache: {
          cache: 'session',
          expiresIn: config.sessionCacheTTL
        },
        cookieOptions: {
          password: cookiePassword,
          isSecure: config.cookieOptions.isSecure,
          isHttpOnly: true,
          isSameSite: 'None',
          ttl: config.sessionCacheTTL
        }//,
        // customSessionIDGenerator: function (request) {
        //   // const sessionID = Uuid.v4()
        //   // protectiveMonitoringServiceSendEvent(request, sessionID, 'FTF-SESSION-CREATED', '0701')
        //   // return sessionID
        //   const sessionID = Crypto.randomUUID();
        //   console.log(sessionID)
        //   return sessionID
        // }
      }
    })
  }
}
