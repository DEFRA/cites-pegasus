const cacheConfig = require('../../config/cache')
const config = require('../../config/config')

module.exports = {
    plugin: require('@hapi/yar'),
      options: {
        maxCookieSize: cacheConfig.useRedis ? 0 : 1024,
        storeBlank: true,
        cache: {
          cache: 'session',
          expiresIn: cacheConfig.expiresIn
        },
        cookieOptions: {
          password: config.cookiePassword,
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
}