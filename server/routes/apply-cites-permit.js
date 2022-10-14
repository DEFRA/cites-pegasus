const textContent = require('../content/text-content')
const viewTemplate = 'apply-cites-permit'

function createModel(){
  const commonContent = textContent.common;
  const pageContent = textContent.applyCitesPermit;

  console.log({ ...commonContent, ...pageContent })
  return { ...commonContent, ...pageContent }
}

module.exports = [{
  method: 'GET',
  path: '/apply-cites-permit',
  handler: (request, h) => {
    return h.view(viewTemplate, createModel());  
  }
},
{
  method: 'GET',
  path: '/',
  handler: (request, h) => {
    return h.view(viewTemplate, createModel()); 
  }
}]
