const textContent = require('../content/text-content')
const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'could-not-confirm'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`

function createModel(){
  const commonContent = textContent.common;
  const pageContent = textContent.couldNotConfirm;

  return { ...commonContent, ...pageContent, backLink: previousPath }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: (request, h) => {
    return h.view(pageId, createModel());  
  }
}]