const config = require('../../config/config')

module.exports = {
  plugin: require('hapi-pino'),
  options: {
    logPayload: true,
    level: config.isDev ? 'debug' : 'warn'
  }
}
