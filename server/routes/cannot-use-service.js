const textContent = require('../content/text-content')
const { urlPrefix, enableOtherPermitTypes } = require("../../config/config")
const pageId = 'cannot-use-service'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPermitType = `${urlPrefix}/permit-type`
const previousPathOtherPermitType = `${urlPrefix}/other-permit-type`

function createModel(){
  const commonContent = textContent.common;
  const pageContent = textContent.cannotUseService;
  let backLink = enableOtherPermitTypes ? previousPathOtherPermitType : previousPathPermitType
  return { ...commonContent, ...pageContent, backLink }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: (request, h) => {
    return h.view(pageId, createModel());  
  }
}]