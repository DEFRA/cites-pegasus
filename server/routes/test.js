const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'test'
const Joi = require('joi')
const { whoAmI } = require('../services/dynamics-service')
const config = require('../../config/config')

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/test`,
    handler: async (request, h) => {
    
      data = {
        keyVaultUri: config.keyVaultUri,
        addressLookupAPICertName: config.addressLookupAPICertName,
        addressLookupBaseUrl: config.addressLookupBaseUrl,
        authorityUrl: config.dynamicsAPI.authorityUrl,
        clientId: config.dynamicsAPI.clientId,
        baseURL: config.dynamicsAPI.baseURL
      }
      return h.view(pageId, data);
    }
  },
  {
    method: 'POST',
    path: `${urlPrefix}/test`,
    handler: async (request, h) => {
      let response = null

      try {
        response = await whoAmI(request.server);
      }
      catch (err) {
        return h.code(500)
      }


      return h.view(pageId, { data: JSON.stringify(response) });
    }
  }]
