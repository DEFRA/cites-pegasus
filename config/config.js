const Joi = require('@hapi/joi')
const urlPrefix = ''
const envs = ['dev', 'test', 'snd', 'pre', 'prod']

require('dotenv').config()

// Define config schema
const schema = Joi.object().keys({
  port: Joi.number().default(3000),
  env: Joi.string().valid(...envs).default(envs[0]),
  urlPrefix: Joi.string().default(urlPrefix),
  
  keyVaultUri: Joi.string().required(),
  cidmApiDiscoveryUrl: Joi.string().required(),
  addressLookupBaseUrl: Joi.string().required(),
  addressLookupAPICertName: Joi.string().required(),
  cookieOptions: Joi.object({
    ttl: Joi.number().default(1000 * 60 * 60 * 24 * 365),
    encoding: Joi.string().valid('base64json').default('base64json'),
    isSecure: Joi.bool().default(true),
    isHttpOnly: Joi.bool().default(true),
    clearInvalid: Joi.bool().default(false),
    strictHeader: Joi.bool().default(true)
  }),
  dynamicsAPI: Joi.object({
    knownAuthority: Joi.string().required(),
    authorityUrl: Joi.string().required(),
    serverUrl: Joi.string().required(),
    baseURL: Joi.string().required()
  })
})

// Build config
const config = {
  port: process.env.PORT || 8080,
  env: process.env.NODE_ENV || 'dev',
  urlPrefix: process.env.URL_PREFIX,
  keyVaultUri: process.env.KEY_VAULT_URI,
  cidmApiDiscoveryUrl: process.env.CIDM_API_DISCOVERY_URL,
  addressLookupBaseUrl: process.env.ADDRESS_LOOKUP_BASE_URL,
  addressLookupAPICertName: process.env.ADDRESS_LOOKUP_API_CERT_NAME,
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
