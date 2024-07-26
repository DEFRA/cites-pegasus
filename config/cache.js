const Joi = require('joi')
const { readSecret } = require('../server/lib/key-vault')
require('dotenv').config()
const config = require('./config')
const catboxRedis = require('@hapi/catbox-redis')
const catboxMemory = require('@hapi/catbox-memory')

const cacheName = 'session'

async function getCacheConfig() {

  if (config.useRedis) {

    let redisPassword = null
    try {
      const secret = await readSecret('REDIS-PASSWORD')
      redisPassword = secret.value      
    }
    catch(err){
      console.error(err)
      throw new Error('Unable to read redis password from key vault')
    }

    const redisOptions = {
      host: config.redisHostname,
      port: config.redisPort,
      password: redisPassword,
      partition: config.redisPartition
    }

    if(config.redisPort !== '6379'){
      redisOptions.tls = { host: config.redisHostname }
    }


    return {
      name: cacheName,
      provider: {
        constructor: catboxRedis,
        options: redisOptions
      }
    }
  }

  const memoryOptions = {
    maxByteSize: config.memoryCacheMaxByteSize
    //minCleanupIntervalMsec: 1000 //1sec
    //cloneBuffersOnGet: false
  }

  return {
    name: cacheName,
    engine: new catboxMemory.Engine(memoryOptions)
  }



  // if(result.value.useRedis){
  //   result.value.catboxOptions.password = await readSecret('REDIS-PASSWORD')
  // } else {
  //   result.value.catboxOptions = {}
  // }

  // return result.value
}

module.exports = { getCacheConfig }//result.value
