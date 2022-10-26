const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'test'
const { whoAmI } = require('../services/dynamics-service')

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/test`,
    handler: async (request, h) => {
      //const authToken = await auth.getClientCredentialsToken()

      return h.view(pageId, null);
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
      catch(err){
        return h.code(500)
      }


      return h.view(pageId, {data: JSON.stringify(response)});
    }
  }]
