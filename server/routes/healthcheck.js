const { urlPrefix } = require('../../config/config')
const session = require('../lib/session')
const blobStorageService = require("../services/blob-storage-service")
const keyVault = require('../lib/key-vault')
const dynamicsService = require('../services/dynamics-service')

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/healthcheck-basic`,
    config: {
      auth: false
    },
    handler: async (request, h) => {
      return h.response('Success').code(200);
    }
  },
  {
    method: 'GET',
    path: `${urlPrefix}/healthcheck-detailed`,
    config: {
      auth: false
    },
    handler: async (request, h) => {

      try {
        console.log('#### HEALTHCHECK #### - Testing key vault connection...')
        await keyVault.readSecret('REDIS-PASSWORD')
        console.log('#### HEALTHCHECK #### - Key vault connection successful')
      }
      catch (err) {
        console.log('#### HEALTHCHECK #### - Key vault connection error')
        console.log(err)
        return h.response('Error calling key vault').code(500)
      }
      
      try {
        console.log('#### HEALTHCHECK #### - Testing redis connection...')
        session.setYarValue(request, 'test', Date.now())
        console.log('#### HEALTHCHECK #### - Redis connection successful')
      }
      catch (err) {
        console.log('#### HEALTHCHECK #### - Redis connection error')
        console.log(err)
        return h.response('Error calling redis session').code(500)
      }
      
      try {
        console.log('#### HEALTHCHECK #### - Testing storage connection...')
        await blobStorageService.checkContainerExists(request.server, 'test')        
        console.log('#### HEALTHCHECK #### - Storage connection successful')
      }
      catch (err) {
        console.log('#### HEALTHCHECK #### - Storage connection error')
        console.log(err)
        return h.response('Error calling blob storage').code(500)
      }
      
      try {        
        console.log('#### HEALTHCHECK #### - Testing dynamics connection...')
        await dynamicsService.whoAmI(request.server)
        console.log('#### HEALTHCHECK #### - Dynamics connection successful')        
      }
      catch (err) {
        console.log('#### HEALTHCHECK #### - Dynamics connection error')
        console.log(err)
        return h.response('Error calling dynamics service').code(500)
      }
      
      return h.response('Success').code(200);
    }
  }]
  