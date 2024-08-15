const { urlPrefix } = require("../../config/config")
const pageId = 'guidance-completion'
const viewName = 'warning'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/other-permit-type`
const nextPath = `${urlPrefix}/applying-on-behalf`
const { getContent } = require('../lib/helper-functions')
const { createGetHandler, createPostHandler } = require('../lib/handler-factory')

function createModel() {
  const { commonContent, pageContent } = getContent("guidanceCompletion")
  
  const model = {
    backLink: previousPath,
    formActionPage: currentPath,
    pageTitle: pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    warningMessage: pageContent.warningMessage
  }

  return { ...commonContent, ...model }

}

module.exports = [
  createGetHandler(pageId, currentPath, null, viewName, createModel),
  createPostHandler(pageId, currentPath, null, () => nextPath)
]
