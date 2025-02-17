const { urlPrefix } = require('../../config/config')
const { getErrorList } = require('../lib/helper-functions')
const { getInputs, createGetHandler, createPostHandler } = require('../lib/importer-details-common')
const { permitType: pt } = require('../lib/permit-type-helper')
const textContent = require('../content/text-content')
const pageId = 'importer-exporter'
const currentPath = `${urlPrefix}/${pageId}`
const currentPathWithParams = `${currentPath}/{applicationIndex}`
const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const nextPathOriginPermitDetails = `${urlPrefix}/origin-permit-details`
const nextPathAdditionalInfo = `${urlPrefix}/additional-info`
const lodash = require('lodash')

function createModel (errors, data) {
  const commonContent = textContent.common

  let pageContent = null

  const importerExporterText = lodash.cloneDeep(textContent.importerExporter) // Need to clone the source of the text content so that the merge below doesn't affect other pages.

  if (data.permitType === pt.IMPORT) {
    pageContent = lodash.merge(importerExporterText.common, importerExporterText.exporterDetails)
  } else {
    pageContent = lodash.merge(importerExporterText.common, importerExporterText.importerDetails)
  }

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['country', 'name', 'addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'postcode'])

  const previousPath = data.sex ? previousPathDescribeLivingAnimal : previousPathDescribeSpecimen

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    heading: pageContent.heading,
    headingAddress: pageContent.headingAddress,
    ...getInputs(pageContent, data, errorList)
  }
  return { ...commonContent, ...model }
}

const getImporterExporterDetails = (submission, applicationIndex) => submission.applications[applicationIndex].importerExporterDetails

const getRedirect = (applicationIndex, permitType) => {
  if (permitType === pt.EXPORT) {
    return `${nextPathAdditionalInfo}/${applicationIndex}`
  } else {
    return `${nextPathOriginPermitDetails}/${applicationIndex}`
  }
}

module.exports = [
  createGetHandler(pageId, currentPathWithParams, createModel, getImporterExporterDetails),
  createPostHandler(pageId, currentPathWithParams, createModel, getRedirect)
]
