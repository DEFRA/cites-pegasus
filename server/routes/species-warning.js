const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { getSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const pageId = 'species-warning'
const viewName = 'warning'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`
const nextPath = `${urlPrefix}/source-code`
const invalidSubmissionPath = `${urlPrefix}/`


function createModel(data) {
  const commonContent = textContent.common
  const pageContent = textContent.speciesWarning


  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    pageTitle: pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    warningMessage: data.warningMessage
  }

  return { ...commonContent, ...model }

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
  handler: async (request, h) => {
    const { applicationIndex } = request.params
    const submission = getSubmission(request)

    try {
      validateSubmission(submission, `${pageId}/${applicationIndex}`)
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }

    const species = submission.applications[applicationIndex].species

    const pageData = {
      applicationIndex: applicationIndex,
      warningMessage: species.warningMessage
    }

    return h.view(viewName, createModel(pageData));
  }
},
{
  method: 'POST',
  path: `${currentPath}/{applicationIndex}`,
  options: {
    validate: {
      params: Joi.object({
        applicationIndex: Joi.number().required()
      })
    }
  },
  handler: async (request, h) => {
    const { applicationIndex } = request.params
    const submission = getSubmission(request)

    try {
      validateSubmission(submission, `${pageId}/${applicationIndex}`)
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }

    const redirectTo = `${nextPath}/${applicationIndex}`
    saveDraftSubmission(request, redirectTo)
    return h.redirect(redirectTo)

  },
}
]