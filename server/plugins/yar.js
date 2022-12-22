const { getCacheConfig } = require('../../config/cache')
const config = require('../../config/config')
const { readSecret } = require('../lib/key-vault')

module.exports = {
  name: 'yar',
  register: async function (server, options) {

    const cookiePassword = (await readSecret('SESSION-COOKIE-PASSWORD')).value
    const cacheConfig = await getCacheConfig()
    
    server.register({
      plugin: require('@hapi/yar'),
      options: {
        maxCookieSize: cacheConfig.useRedis ? 0 : 1024,
        storeBlank: true,
        cache: {
          cache: 'session',
          expiresIn: cacheConfig.expiresIn
        },
        cookieOptions: {
          password: cookiePassword,
          isSecure: config.cookieOptions.isSecure,
          ttl: cacheConfig.expiresIn
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
  },
}