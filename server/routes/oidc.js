const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'oidc'
//const Joi = require('joi')

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/${pageId}`,
    handler: async (request, h) => {
      return h.view(pageId, null);
    }
  }
]
