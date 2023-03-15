const textContent = require('../content/text-content')
const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'apply-cites-permit'
const currentPath = `${urlPrefix}/${pageId}`

function createModel(){
  const commonContent = textContent.common;
  const pageContent = textContent.applyCitesPermit;

  return { ...commonContent, ...pageContent }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  config: {
    auth: false // authentication is not required
  },
  handler: (request, h) => {
    return h.view(pageId, createModel());  
  }
},
{
  method: 'GET',
  path: `${urlPrefix}/`,
  config: {
    auth: false // authentication is not required
  },
  handler: (request, h) => {
    return h.redirect(currentPath)// view(pageId, createModel()); 
  }
}]
