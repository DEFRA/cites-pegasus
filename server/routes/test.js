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
      
      
      return h.view(pageId, { anothertestsetting: config.ANOTHERTESTSETTING });
    }
  },
  {
    method: 'POST',
    path: `${urlPrefix}/test`,
    handler: async (request, h) => {
      let response = null

      try {
        response = await whoAmI(request);
      }
      catch (err) {
        return h.code(500)
      }


      return h.view(pageId, { data: JSON.stringify(response) });
    }
  }]
