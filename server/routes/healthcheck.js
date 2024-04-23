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
        await keyVault.readSecret('REDIS-PASSWORD')
      }
      catch (err) {
        return h.response('Error calling key vault').code(500)
      }
      
      try {
        session.setYarValue(request, 'test', Date.now())
      }
      catch (err) {
        return h.response('Error calling redis session').code(500)
      }
      
      try {
        await blobStorageService.checkContainerExists(request.server, 'test')        
      }
      catch (err) {
        return h.response('Error calling blob storage').code(500)
      }
      
      try {        
        await dynamicsService.whoAmI(request.server)
      }
      catch (err) {
        return h.response('Error calling dynamics service').code(500)
      }
      
      return h.response('Success').code(200);
    }
  }]
  