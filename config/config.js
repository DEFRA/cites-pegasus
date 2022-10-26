const Joi = require('@hapi/joi')
const urlPrefix = ''
const envs = ['dev', 'test', 'prod']

require('dotenv').config()

// Define config schema
const schema = Joi.object().keys({
  urlPrefix: Joi.string().default(urlPrefix),
  port: Joi.number().default(3000),
  env: Joi.string().valid(...envs).default(envs[0]),
  cookiePassword: Joi.string().default('dummycookiepassworddummycookiepassword'),
  cookieOptions: Joi.object({
    ttl: Joi.number().default(1000 * 60 * 60 * 24 * 365),
    encoding: Joi.string().valid('base64json').default('base64json'),
    isSecure: Joi.bool().default(true),
    isHttpOnly: Joi.bool().default(true),
    clearInvalid: Joi.bool().default(false),
    strictHeader: Joi.bool().default(true)
  }),
  dynamicsAPI: Joi.object({
    knownAuthority: Joi.string(),
    authorityUrl: Joi.string(),
    clientId: Joi.string(),
    clientSecret: Joi.string(),
    serverUrl: Joi.string(),
    baseURL: Joi.string()
  })
})

// Build config
const config = {
  urlPrefix: process.env.URL_PREFIX,
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  cookiePassword: process.env.COOKIE_PASSWORD,
  cookieOptions: {
    ttl: process.env.COOKIE_TTL_IN_MILLIS,
    encoding: 'base64json',
    isSecure: process.env.NODE_ENV === 'production',
    isHttpOnly: true,
    clearInvalid: false,
    strictHeader: true
  },
  dynamicsAPI: {
    knownAuthority: process.env.KNOWN_AUTHORITY,
    authorityUrl: process.env.AUTHORITY_URL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    serverUrl: process.env.SERVER_URL,
    baseURL: process.env.BASE_URL
  }
}

// Validate config
const { error, value } = schema.validate(config)

// Throw if config is invalid
if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

// Add some helper props
value.isDev = value.env === 'dev'

module.exports = value
