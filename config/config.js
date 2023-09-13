const Joi = require('@hapi/joi')
const urlPrefix = ''
const envs = ['local', 'dev', 'test', 'snd', 'pre', 'prod']

require('dotenv').config()

// Define config schema
const schema = Joi.object().keys({
  port: Joi.number().required(),
  env: Joi.string().valid(...envs).default(envs[0]),
  urlPrefix: Joi.string().default(urlPrefix),
  
  keyVaultUri: Joi.string().required(),
  cidmCallbackUrl: Joi.string().required(),
  cidmApiDiscoveryUrl: Joi.string().required(),
  cidmAccountManagementUrl: Joi.string().required(),
  cidmPostLogoutRedirectUrl: Joi.string().allow("", null),
  addressLookupBaseUrl: Joi.string().required(),
  addressLookupAPICertName: Joi.string().required(),
  enableSpeciesWarning: Joi.boolean(),
  enableDraftSubmission: Joi.boolean(),
  enableFilterSubmittedBy: Joi.boolean(),
  cookieOptions: Joi.object({
    ttl: Joi.number().default(1000 * 60 * 60 * 24 * 365),
    //encoding: Joi.string().valid('base64json').default('base64json'),
    isSecure: Joi.bool().default(true),
    //isHttpOnly: Joi.bool().default(true),
    //clearInvalid: Joi.bool().default(false),
    //strictHeader: Joi.bool().default(true)
  }),
  dynamicsAPI: Joi.object({
    knownAuthority: Joi.string().required(),
    authorityUrl: Joi.string().required(),
    apiPath: Joi.string().required(),
    baseURL: Joi.string().required()
  }),
  govpayPaymentsURL: Joi.string().required(),
  govpayCallbackURL: Joi.string().required()

})

// Build config
const config = {
  port: process.env.PORT || 8080,
  env: process.env.NODE_ENV || 'local',
  urlPrefix: process.env.URL_PREFIX,
  keyVaultUri: process.env.KEY_VAULT_URI,
  cidmCallbackUrl: process.env.CIDM_CALLBACK_URL,
  cidmApiDiscoveryUrl: process.env.CIDM_API_DISCOVERY_URL,
  cidmAccountManagementUrl: process.env.CIDM_ACCOUNT_MANAGEMENT_URL,
  cidmPostLogoutRedirectUrl: process.env.CIDM_POST_LOGOUT_REDIRECT_URL,
  addressLookupBaseUrl: process.env.ADDRESS_LOOKUP_BASE_URL,
  addressLookupAPICertName: process.env.ADDRESS_LOOKUP_API_CERT_NAME,
  enableSpeciesWarning: process.env.ENABLE_SPECIES_WARNING || false,
  enableDraftSubmission: process.env.ENABLE_DRAFT_SUBMISSION || false,
  enableFilterSubmittedBy: process.env.ENABLE_FILTER_SUBMITTED_BY || false,
  cookieOptions: {
    ttl: process.env.COOKIE_TTL_IN_MILLIS,
    //encoding: 'base64json',
    isSecure: true, //process.env.NODE_ENV === 'production',
    //isHttpOnly: true,
    //clearInvalid: false,
    //strictHeader: true
  },
  dynamicsAPI: {
    knownAuthority: process.env.KNOWN_AUTHORITY,
    authorityUrl: process.env.AUTHORITY_URL,
    apiPath: process.env.DYNAMICS_API_PATH,
    baseURL: process.env.DYNAMICS_BASE_URL
  },
  govpayPaymentsURL: process.env.GOVPAY_PAYMENTS_URL,
  govpayCallbackURL: process.env.GOVPAY_CALLBACK_URL
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
