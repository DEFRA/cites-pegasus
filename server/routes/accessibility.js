const textContent = require('../content/text-content')
const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'accessibility'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathMySubmissions = `${urlPrefix}/my-submissions`


function createModel(previousPath){
  const commonContent = textContent.common;
  const pageContent = textContent.accessibility;
  const backLink = previousPath || previousPathMySubmissions

  return { ...commonContent, ...pageContent, backLink }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: (request, h) => {
    const previousPath = request.headers.referer
    return h.view(pageId, createModel(previousPath));  
  }
}]