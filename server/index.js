const hapi = require('@hapi/hapi')
const config = require('../config/config')
const cacheConfig = require('../config/cache')
//const catbox = cacheConfig.useRedis ? require('@hapi/catbox-redis') : require('@hapi/catbox-memory')
//const catbox = require('@hapi/catbox-memory')

async function createServer () {
  // Create the hapi server
  const server = hapi.server({
    port: config.port,
    // cache: [{
    //   name: 'session',
    //   provider: {
    //     constructor: catbox
    //     options: cacheConfig.catboxOptions
    //   }
    // }],
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    }
  })

  // Register the plugins
  await server.register(require('@hapi/inert'))  
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/logging'))
  await server.register(require('./plugins/yar'))
  await server.register(require('blipp'))

  return server
}

module.exports = createServer
