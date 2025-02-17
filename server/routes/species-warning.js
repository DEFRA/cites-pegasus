const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const pageId = 'species-warning'
const viewName = 'warning'
const currentPath = `${urlPrefix}/${pageId}`
const currentPathWithParams = `${currentPath}/{applicationIndex}`
const previousPath = `${urlPrefix}/species-name`
const nextPath = `${urlPrefix}/source-code`
const { getContent } = require('../lib/helper-functions')
const { createGetHandler, createPostHandler } = require('../lib/basic-handler-factory')

function createModel (data) {
  const { commonContent, pageContent } = getContent('speciesWarning')

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    pageTitle: pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    warningMessage: data.submission.applications[data.applicationIndex].species.warningMessage
  }

  return { ...commonContent, ...model }
}

const getRedirect = (params) => `${nextPath}/${params.applicationIndex}`

const pathValidation = Joi.object({ applicationIndex: Joi.number().required() })

module.exports = [
  createGetHandler(currentPathWithParams, pathValidation, viewName, createModel),
  createPostHandler(currentPathWithParams, pathValidation, getRedirect)
]
