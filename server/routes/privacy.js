const textContent = require('../content/text-content')
const { urlPrefix } = require("../../config/config")
const pageId = 'privacy'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathMySubmissions = `${urlPrefix}/my-submissions`


function createModel(previousPath){
  const commonContent = textContent.common;
  const pageContent = textContent.privacy;
  const backLink = previousPath || previousPathMySubmissions
  const pageTitle = pageContent.defaultTitle + commonContent.pageTitleSuffix
  return { ...commonContent, ...pageContent, backLink, pageTitle }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: (request, h) => {
    const previousPath = request.headers.referer
    return h.view(pageId, createModel(previousPath));  
  }
}]