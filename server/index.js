const hapi = require('@hapi/hapi')
const config = require('../config/config')
const { getCacheConfig } = require('../config/cache')
var Fs = require('fs');

//Run this command line to create certs
//openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365

async function createServer() {
  const cacheConfig = await getCacheConfig()
  const catbox = cacheConfig.useRedis ? require('@hapi/catbox-redis') : require('@hapi/catbox-memory')

  const tlsConfig = {
    key: Fs.readFileSync('certs/key.pem'),
    cert: Fs.readFileSync('certs/cert.pem')
  }

  // Create the hapi server
  const server = hapi.server({
    port: config.port,
    tls: tlsConfig, //COMMENT THIS OUT TO GO BACK TO HTTP
    cache: [{
      name: 'session',
      provider: {
        constructor: catbox,
        options: cacheConfig.catboxOptions
      }
    }],
    routes: {
      // auth: {
      //   mode: 'optional' //UNCOMMENT THIS TO DISABLE SECURITY
      // },
      validate: {
        options: {
          abortEarly: false
        }
      }
    }
  })

  //Create the OpenID client
  //TODO Add a call to the oidc-client.js file here to get the client
  //server.app.openidClient = client;

  // Register the plugins
  await server.register(require('@hapi/inert'))
  await server.register(require('./plugins/oidc-auth'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/logging'))
  await server.register(require('./plugins/yar'))
  await server.register(require('blipp'))

  return server
}

module.exports = createServer
