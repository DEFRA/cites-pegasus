const Joi = require('joi')
const { readSecret } = require('../server/lib/key-vault')
require('dotenv').config()

// Define config schema
const schema = Joi.object({
  useRedis: Joi.bool().default(false),
  expiresIn: Joi.number().default(1200 * 1000), // 20 min
  catboxOptions: Joi.object({
    host: Joi.string().required(),
    port: Joi.string().required(),
    //password: Joi.string().allow(''),
    partition: Joi.string().required(),
    tls: Joi.object()
  })
})

const config = {
  useRedis: true, //process.env.NODE_ENV !== 'test',
  expiresIn: process.env.SESSION_CACHE_TTL,
  catboxOptions: {
    host: process.env.REDIS_HOSTNAME,
    port: process.env.REDIS_PORT,
    //password: process.env.REDIS_PASSWORD,
    partition: process.env.REDIS_PARTITION,
    tls: {host: process.env.REDIS_HOSTNAME}//process.env.NODE_ENV === 'production' ? {servername: process.env.REDIS_HOSTNAME} : undefined
  }
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The cache config is invalid. ${result.error.message}`)
}

async function getCacheConfig(){    
  const redisPassword = await readSecret('REDIS-PASSWORD')
  result.value.catboxOptions.password = redisPassword.value
  return result.value
}

module.exports = { getCacheConfig }//result.value
