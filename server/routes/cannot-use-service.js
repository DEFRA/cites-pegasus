const urlPrefix = require('../../config/config').urlPrefix
const { findTextContent } = require('../helpers/helper-functions')

const viewTemplate = 'cannot-use-service'
const currentPath = `${urlPrefix}/${viewTemplate}`
const previousPath = `${urlPrefix}/permit-type`


module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
        return h.view(viewTemplate, {headingText: findTextContent(viewTemplate).heading});
  }
}
]