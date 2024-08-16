const textContent = require('../content/text-content')
const { urlPrefix, enableOtherPermitTypes } = require("../../config/config")
const pageId = 'help'
const currentPath = `${urlPrefix}/${pageId}`

function createModel(){
  const commonContent = textContent.common
  const pageContent = textContent.help
  const pageTitle = pageContent.defaultTitle + commonContent.pageTitleSuffix
  return { ...commonContent, ...pageContent, pageTitle }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: (_request, h) => {
    return h.view(pageId, createModel());  
  }
}]