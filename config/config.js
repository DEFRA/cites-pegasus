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
  cidmPostLogoutRedirectUrl: Joi.string().allow('', null),
  serviceRoleAdminUser: Joi.string().required(),
  addressLookupBaseUrl: Joi.string().required(),
  addressLookupAPICertName: Joi.string().required(),
  appInsightsInstrumentationKey: Joi.string().allow('', null),
  appInsightsInstrumentationCloudRole: Joi.string().allow('', null),
  documentUploadMaxFilesLimit: Joi.number(),
  enableSpeciesWarning: Joi.boolean(),
  enableDraftSubmission: Joi.boolean(),
  enableFilterSubmittedBy: Joi.boolean(),
  enableDeliveryType: Joi.boolean(),
  enableOtherPermitTypes: Joi.boolean(),
  enableInternalReference: Joi.boolean(),
  enableBreederPage: Joi.boolean(),
  enableDeliveryName: Joi.boolean(),
  enableSpeciesNameTypeahead: Joi.boolean(),
  enableNotKnownTradeTermCode: Joi.boolean(),
  enableGenerateExportPermitsFromA10s: Joi.boolean(),
  maxNumberOfUniqueIdentifiers: Joi.number().min(1),
  cookieOptions: Joi.object({
    ttl: Joi.number(),
    // encoding: Joi.string().valid('base64json').default('base64json'),
    isSecure: Joi.bool().default(true)
    // isHttpOnly: Joi.bool().default(true),
    // clearInvalid: Joi.bool().default(false),
    // strictHeader: Joi.bool().default(true)
  }),
  dynamicsAPI: Joi.object({
    knownAuthority: Joi.string().required(),
    authorityUrl: Joi.string().required(),
    apiPath: Joi.string().required(),
    baseURL: Joi.string().required()
  }),
  govpayPaymentsURL: Joi.string().required(),
  govpayCallbackURL: Joi.string().required(),
  googleTagId: Joi.string().allow('', null),
  storageAccountUrl: Joi.string().required(),
  useRedis: Joi.boolean().required(),
  redisHostname: Joi.string().when('useRedis', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null)
  }),
  redisPort: Joi.string().when('useRedis', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null)
  }),
  redisPartition: Joi.string().when('useRedis', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null)
  }),
  memoryCacheMaxByteSize: Joi.string().when('useRedis', {
    is: true,
    then: Joi.string().allow('', null),
    otherwise: Joi.string().required()
  }),
  sessionCacheTTL: Joi.number(),
  antiVirusTimeout: Joi.number(),
  antiVirusCheckInterval: Joi.number()
})

// Build config
const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV || 'local',
  urlPrefix: process.env.URL_PREFIX,
  keyVaultUri: process.env.KEY_VAULT_URI,
  cidmCallbackUrl: process.env.CIDM_CALLBACK_URL,
  cidmApiDiscoveryUrl: process.env.CIDM_API_DISCOVERY_URL,
  cidmAccountManagementUrl: process.env.CIDM_ACCOUNT_MANAGEMENT_URL,
  cidmPostLogoutRedirectUrl: process.env.CIDM_POST_LOGOUT_REDIRECT_URL,
  serviceRoleAdminUser: process.env.SERVICE_ROLE_ADMIN_USER,
  addressLookupBaseUrl: process.env.ADDRESS_LOOKUP_BASE_URL,
  addressLookupAPICertName: process.env.ADDRESS_LOOKUP_API_CERT_NAME,
  appInsightsInstrumentationKey: process.env.APP_INSIGHTS_INSTRUMENTATION_KEY,
  appInsightsInstrumentationCloudRole: process.env.APP_INSIGHTS_INSTRUMENTATION_CLOUD_ROLE,
  documentUploadMaxFilesLimit: process.env.DOCUMENT_UPLOAD_MAX_FILES_LIMIT,
  enableSpeciesWarning: process.env.ENABLE_SPECIES_WARNING || false,
  enableDraftSubmission: process.env.ENABLE_DRAFT_SUBMISSION || false,
  enableFilterSubmittedBy: process.env.ENABLE_FILTER_SUBMITTED_BY || false,
  enableDeliveryType: process.env.ENABLE_DELIVERY_TYPE || false,
  enableOtherPermitTypes: process.env.ENABLE_OTHER_PERMIT_TYPES || false,
  enableInternalReference: process.env.ENABLE_INTERNAL_REFERENCE || false,
  enableBreederPage: process.env.ENABLE_BREEDER_PAGE || false,
  enableDeliveryName: process.env.ENABLE_DELIVERY_NAME || false,
  enableSpeciesNameTypeahead: process.env.ENABLE_SPECIES_NAME_TYPEAHEAD || false,
  enableGenerateExportPermitsFromA10s: process.env.ENABLE_GENERATE_EXPORT_PERMITS_FROM_A10S || false,
  maxNumberOfUniqueIdentifiers: process.env.MAX_NUMBER_OF_UNIQUE_IDENTIFIERS,
  enableNotKnownTradeTermCode: process.env.ENABLE_NOT_KNOWN_TRADE_TERM_CODE || false,
  cookieOptions: {
    ttl: process.env.COOKIE_TTL_IN_MILLIS,
    // encoding: 'base64json',
    isSecure: true // process.env.NODE_ENV === 'production',
    // isHttpOnly: true,
    // clearInvalid: false,
    // strictHeader: true
  },
  dynamicsAPI: {
    knownAuthority: process.env.KNOWN_AUTHORITY,
    authorityUrl: process.env.AUTHORITY_URL,
    apiPath: process.env.DYNAMICS_API_PATH,
    baseURL: process.env.DYNAMICS_BASE_URL
  },
  govpayPaymentsURL: process.env.GOVPAY_PAYMENTS_URL,
  govpayCallbackURL: process.env.GOVPAY_CALLBACK_URL,
  googleTagId: process.env.GOOGLE_TAG_ID,
  storageAccountUrl: process.env.STORAGE_ACCOUNT_URL,
  useRedis: process.env.USE_REDIS,
  redisHostname: process.env.REDIS_HOSTNAME,
  redisPort: process.env.REDIS_PORT,
  redisPartition: process.env.REDIS_PARTITION,
  memoryCacheMaxByteSize: process.env.MEMORY_CACHE_MAX_BYTE_SIZE,
  sessionCacheTTL: process.env.SESSION_CACHE_TTL,
  antiVirusTimeout: process.env.ANTIVIRUS_TIMEOUT,
  antiVirusCheckInterval: process.env.ANTIVIRUS_CHECK_INTERVAL
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
