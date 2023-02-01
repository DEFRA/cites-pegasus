const Joi = require("joi")
const textContent = require('../content/text-content')
const { getSubmission } = require('../lib/submission')
const { getYarValue } = require("../lib/session")
const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'could-not-confirm'
const currentPath = `${urlPrefix}/${pageId}`

function createModel(unknownSpeciesName, applicationIndex){
  const commonContent = textContent.common;
  const pageContent = textContent.couldNotConfirm;
  const previousPath = `${urlPrefix}/species-name/${applicationIndex}`

  return { ...commonContent, ...pageContent, backLink: previousPath, unknownSpeciesName: unknownSpeciesName }
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        })
      }
    },
  handler: (request, h) => {
    const submission = getSubmission(request)
    const unknownSpeciesName = submission.applications[request.params.applicationIndex].species.speciesSearchData
    return h.view(pageId, createModel(unknownSpeciesName, request.params.applicationIndex));  
  }
}]