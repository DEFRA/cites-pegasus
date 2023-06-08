const config = require('../../config/config')

module.exports = {
  plugin: require('hapi-pino'),
  options: {
    redact: ['req.headers.authorization'],
    logPayload: true,
    level: config.isDev ? 'debug' : 'warn'
  }
}
