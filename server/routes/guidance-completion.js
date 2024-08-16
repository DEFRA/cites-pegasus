const { urlPrefix } = require("../../config/config")
const pageId = 'guidance-completion'
const viewName = 'warning'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/other-permit-type`
const nextPath = `${urlPrefix}/applying-on-behalf`
const { getContent } = require('../lib/helper-functions')
const { createGetHandler, createPostHandler } = require('../lib/basic-handler-factory')

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
  createGetHandler(currentPath, null, viewName, createModel),
  createPostHandler(currentPath, null, () => nextPath)
]
