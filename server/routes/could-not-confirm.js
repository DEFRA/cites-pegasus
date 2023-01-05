const textContent = require('../content/text-content')
const { getYarValue } = require("../lib/session")
const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'could-not-confirm'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`

function createModel(unknownSpeciesName){
  const commonContent = textContent.common;
  const pageContent = textContent.couldNotConfirm;

  return { ...commonContent, ...pageContent, backLink: previousPath, unknownSpeciesName: unknownSpeciesName }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: (request, h) => {
    const unknownSpeciesName = getYarValue(request, 'unknownSpeciesName')
    return h.view(pageId, createModel(unknownSpeciesName));  
  }
}]