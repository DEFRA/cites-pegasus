const { urlPrefix } = require('../../config/config')
const { getErrorList } = require('../lib/helper-functions')
const { getInputs, createGetHandler, createPostHandler } = require('../lib/importer-details-common')
const textContent = require('../content/text-content')
const pageId = 'importer-details'
const currentPath = `${urlPrefix}/${pageId}`
const currentPathWithParams = `${currentPath}/{applicationIndex}`
const previousPathAddExportPermit = `${urlPrefix}/add-export-permit`
const nextPathAppSummary = `${urlPrefix}/application-summary/check`

function createModel (errors, data) {
  const { common: commonContent, importerDetails: pageContent } = textContent
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['country', 'name', 'addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'postcode'])

  const defaultBacklink = `${previousPathAddExportPermit}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    heading: pageContent.heading,
    headingAddress: pageContent.headingAddress,
    insetText: {
      text: pageContent.insetText
    },
    ...getInputs(pageContent, data, errorList)
  }
  return { ...commonContent, ...model }
}

const getImporterExporterDetails = (submission, applicationIndex) => submission.applications[applicationIndex].a10ExportData?.importerDetails
const getRedirect = (applicationIndex) => `${nextPathAppSummary}/${applicationIndex}`

module.exports = [
  createGetHandler(pageId, currentPathWithParams, createModel, getImporterExporterDetails),
  createPostHandler(pageId, currentPathWithParams, createModel, getRedirect)
]
