const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { getSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const pageId = 'guidance-completion'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/other-permit-type`
const nextPath = `${urlPrefix}/applying-on-behalf`
const invalidSubmissionPath = `${urlPrefix}/`


function createModel(errors) {
  const commonContent = textContent.common
  const pageContent = textContent.guidanceCompletion


  const model = {
    backLink: previousPath,
    formActionPage: currentPath,
    pageTitle: pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    warningMessage: pageContent.warningMessage
  }

  return { ...commonContent, ...model }

}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const submission = getSubmission(request)

    try {
      validateSubmission(submission, pageId)
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }
    
    return h.view('warning', createModel(null));
  }
},
{
  method: 'POST',
  path: currentPath,
  handler: async (request, h) => {
    const submission = getSubmission(request)

    try {
      validateSubmission(submission, pageId)
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }

    const redirectTo = nextPath
    saveDraftSubmission(request, redirectTo)
    return h.redirect(redirectTo)

  },
}
]