const { urlPrefix } = require("../../config/config")
const { getErrorList } = require('../lib/helper-functions')
const { getInputs, createGetHandler, createPostHandler } = require('../lib/importer-details-common')
const { permitType: pt } = require('../lib/permit-type-helper')
const textContent = require('../content/text-content')
const pageId = 'importer-exporter'
const currentPath = `${urlPrefix}/${pageId}`
const currentPathWithParams = `${currentPath}/{applicationIndex}`
const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const lodash = require('lodash')

function createModel(errors, data) {

  const commonContent = textContent.common

  let pageContent = null

  const importerExporterText = lodash.cloneDeep(textContent.importerExporter) //Need to clone the source of the text content so that the merge below doesn't affect other pages.

  if (data.permitType === pt.IMPORT) {
    pageContent = lodash.merge(importerExporterText.common, importerExporterText.exporterDetails)
  } else {
    pageContent = lodash.merge(importerExporterText.common, importerExporterText.importerDetails)
  }

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["country", "name", "addressLine1", "addressLine2", "addressLine3", "addressLine4", "postcode"])

  const previousPath = data.sex ? previousPathDescribeLivingAnimal : previousPathDescribeSpecimen

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text  + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    heading: pageContent.heading,
    headingAddress: pageContent.headingAddress,
    ...getInputs(pageContent, data, errorList)
  }
  return { ...commonContent, ...model }
}


const getImporterExporterDetails = (submission, applicationIndex) => submission.applications[applicationIndex].importerExporterDetails

module.exports = [
  createGetHandler(pageId, currentPathWithParams, createModel, getImporterExporterDetails),
  createPostHandler(pageId, currentPathWithParams, createModel)
]

//   {
//     method: "POST",
//     path: `${currentPath}/{applicationIndex}`,
//     options: {
//       validate: {
//         params: Joi.object({
//           applicationIndex: Joi.number().required()
//         }),
//         options: { abortEarly: false },
//         payload: Joi.object({
//           country: Joi.string().max(stringLength.max150).required(),
//           name: Joi.string().max(stringLength.max150).regex(NAME_REGEX).required(),
//           addressLine1: Joi.string().max(stringLength.max150).required(),
//           addressLine2: Joi.string().max(stringLength.max150).required(),
//           addressLine3: Joi.string().max(stringLength.max150).optional().allow('', null),
//           addressLine4: Joi.string().max(stringLength.max150).optional().allow('', null),
//           postcode: Joi.string().max(stringLength.max50).optional().allow('', null)
//         }),
//         failAction: (request, h, err) => {
//           const { applicationIndex } = request.params
//           const submission = getSubmission(request)
//           const pageData = {
//             backLinkOverride: checkChangeRouteExit(request, true),
//             applicationIndex: applicationIndex,
//             permitType: submission.permitType,
//             sex: submission.applications[applicationIndex].species.sex,
//             ...request.payload,
//             countries: request.server.app.countries,
//           }
//           return h.view(pageId, createModel(err, pageData)).takeover()
//         }
//       },
//       handler: async (request, h) => {
//         const { applicationIndex } = request.params
//         const submission = getSubmission(request)

//         const selectedCountry = request.server.app.countries.find(country => country.code === (request.payload.country || 'UK'))


//         const importerExporterDetails = {
//           country: selectedCountry.code,
//           countryDesc: selectedCountry.name,
//           name: request.payload.name.trim(),
//           addressLine1: request.payload.addressLine1.trim(),
//           addressLine2: request.payload.addressLine2.trim(),
//           addressLine3: request.payload.addressLine3.trim(),
//           addressLine4: request.payload.addressLine4.trim(),
//           postcode: request.payload.postcode.trim()
//         }

//         submission.applications[applicationIndex].importerExporterDetails = importerExporterDetails

//         try {
//           mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`
//           )
//         } catch (err) {
//           console.error(err)
//           return h.redirect(invalidSubmissionPath)
//         }

//         const exitChangeRouteUrl = checkChangeRouteExit(request, false)
//         if (exitChangeRouteUrl) {
//           saveDraftSubmission(request, exitChangeRouteUrl)
//           return h.redirect(exitChangeRouteUrl)
//         }

//         const redirectTo = submission.permitType === pt.EXPORT ? `${nextPathAdditionalInfo}/${applicationIndex}` : `${nextPathOriginPermitDetails}/${applicationIndex}`

//         saveDraftSubmission(request, redirectTo)
//         return h.redirect(redirectTo)

//       }
//     }
//   }
// ]
