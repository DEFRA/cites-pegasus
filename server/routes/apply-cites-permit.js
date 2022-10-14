const textContent = require('../content/text-content')
const urlPrefix = require('../../config/config').urlPrefix
const viewTemplate = 'apply-cites-permit'
const currentPath = `${urlPrefix}/${viewTemplate}`

function createModel(){
  const commonContent = textContent.common;
  const pageContent = textContent.applyCitesPermit;

  return { ...commonContent, ...pageContent }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: (request, h) => {
    return h.view(viewTemplate, createModel());  
  }
},
{
  method: 'GET',
  path: `${urlPrefix}/`,
  handler: (request, h) => {
    return h.redirect(currentPath)// view(viewTemplate, createModel()); 
  }
}]
