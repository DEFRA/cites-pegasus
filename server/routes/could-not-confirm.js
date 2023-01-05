const Joi = require("joi")
const textContent = require('../content/text-content')
const { getAppData } = require('../lib/app-data')
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
  path: `${currentPath}/{speciesIndex}`,
    options: {
      validate: {
        params: Joi.object({
          speciesIndex: Joi.number().required()
        })
      }
    },
  handler: (request, h) => {
    const appData = getAppData(request)
    const unknownSpeciesName = appData.species[request.params.speciesIndex].speciesSearchData
    return h.view(pageId, createModel(unknownSpeciesName));  
  }
}]