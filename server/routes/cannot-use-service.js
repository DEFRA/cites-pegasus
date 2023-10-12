const textContent = require('../content/text-content')
const { urlPrefix } = require("../../config/config")
const pageId = 'cannot-use-service'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/permit-type`

function createModel(){
  const commonContent = textContent.common;
  const pageContent = textContent.cannotUseService;

  return { ...commonContent, ...pageContent, backLink: previousPath }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: (request, h) => {
    return h.view(pageId, createModel());  
  }
}]