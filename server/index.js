const hapi = require('@hapi/hapi')
const config = require('../config/config')
const { getCacheConfig } = require('../config/cache')
const Fs = require('fs');
const { getOpenIdClient } = require('./services/oidc-client');
const { getCountries, getAccessToken, getTradeTermCodes } = require('./services/dynamics-service')
const { getBlobServiceClient } = require('./services/blob-storage-service')
//Run this command line to create certs
//openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365

async function createServer() {
  console.log('###### CITES PORTAL STARTUP: Creating server config ######')
  console.log('Environment: ' + config.env)
  const cacheConfig = await getCacheConfig()
  const catbox = cacheConfig.useRedis ? require('@hapi/catbox-redis') : require('@hapi/catbox-memory')

  const tlsConfig = config.env === 'local' ? {
    key: Fs.readFileSync('key.pem'),
    cert: Fs.readFileSync('cert.pem')
  } : null

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
      security: {
        hsts: { //Adds the HSTS header to all responses.
          includeSubDomains: true,
          preload: true,
          maxAge: 15768000
        }
      },
      validate: {
        options: {
          abortEarly: false
        }
      }
    }
  })

  
  console.log('###### CITES PORTAL STARTUP: Configuring application insights ######')
  
  await server.register(require('../server/plugins/app-insights-plugin'))
  
  console.log('###### CITES PORTAL STARTUP: Getting dynamics access token ######')
  await getAccessToken(server)

  console.log('###### CITES PORTAL STARTUP: Getting blob service client ######')
  await getBlobServiceClient(server)

  console.log('###### CITES PORTAL STARTUP: Getting dynamics ref data ######')
  const [oidcClient, countries, tradeTermCodes] = await Promise.all([
    getOpenIdClient(),
    getCountries(server),
    getTradeTermCodes(server)
  ]);

  server.app.oidcClient = oidcClient;
  server.app.countries = countries;
  server.app.tradeTermCodes = tradeTermCodes;

  
  
  console.log('###### CITES PORTAL STARTUP: Registering plugins ######')
  // Register the plugins
  await server.register(require('@hapi/inert'))
  await server.register(require('./plugins/oidc-auth'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/logging'))
  await server.register(require('./plugins/yar'))
  await server.register(require('blipp'))
  
  await server.initialize();
  console.log(`###### CITES PORTAL STARTUP: Server initialized - Ready to start ######`)
  return server
}

const init = async () => {
  const server = await createServer()
  return server;
};

const start = async () => {
  const server = await createServer()
  await server.start();
  console.log(`###### CITES PORTAL STARTUP: Server started on port ${server.info.uri} ######`)  
  
  return server;
};
process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
})

module.exports = { init, start }
