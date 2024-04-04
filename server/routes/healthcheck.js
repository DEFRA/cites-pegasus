const { urlPrefix } = require('../../config/config')
const { setYarValue } = require('../lib/session')
const { checkContainerExists } = require("../services/blob-storage-service")
const { readSecret } = require('../lib/key-vault')
const { whoAmI } = require('../services/dynamics-service')

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
        await readSecret('REDIS-PASSWORD')
      }
      catch (err) {
        return h.response('Error calling key vault').code(500)
      }

      try {
        setYarValue(request, 'test', Date.now())
      }
      catch (err) {
        return h.response('Error calling redis session').code(500)
      }

      try {
        await checkContainerExists('test')        
      }
      catch (err) {
        return h.response('Error calling blob storage').code(500)
      }
      
      try {
        response = await whoAmI(request.server);
      }
      catch (err) {
        return h.response('Error calling dynamics service').code(500)
      }

      return h.response('Success').code(200);
    }
  }]
