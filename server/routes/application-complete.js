const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { getSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const pageId = 'application-complete'
const currentPath = `${urlPrefix}/${pageId}`
//const previousPath = `${urlPrefix}/`
const nextPathMySubmissions = `${urlPrefix}/`
const nextPathExportSubmission = `${urlPrefix}/my-submissions/draft-continue`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.applicationComplete
  let pageBodyContent

  if (data.paid) {
    pageBodyContent = pageContent.paid
  } else {
    pageBodyContent = data.costingType === 'simple' ? pageContent.notPaid.simple : pageContent.notPaid.complex
  }

  const panelContent = {
    titleText: pageContent.panelHeading,
    html: `${pageContent.panelText}<br><strong>${data.submissionRef}</strong>`
  }


  const model = {
    isExportSubmissionWaiting: data.isExportSubmissionWaiting,
    formActionPage: currentPath,
    defaultTitle: pageContent.defaultTitle,
    pageBody: pageContent.pageBody,
    pageTitle: pageContent.defaultTitle + commonContent.pageTitleSuffix,
    panelContent: panelContent,
    pageHeader: pageContent.pageHeader,
    pageBody1: pageBodyContent.pageBody1,
    pageBodyWarning: pageBodyContent.pageBodyWarning,
    pageBody2: pageBodyContent.pageBody2,
    pageBody3: pageBodyContent.pageBody3,
    pageBody4: pageBodyContent.pageBody4,
    buttonGoToExportSubmission: pageContent.buttonGoToExportSubmission,
    formActionFinish: currentPath + '/finish',
    formActionGoToExport: currentPath + '/go-to-export'
  }

  return { ...commonContent, ...model }

}

module.exports = [{
  method: 'GET',
  path: currentPath,
  config: {
    auth: false
  },
  handler: async (request, h) => {
    const submission = getSubmission(request) || null
    const isExportSubmissionWaiting = submission.applications.some(app => app.a10ExportData?.isExportPermitRequired)

    const pageData = {
      submissionRef: submission.submissionRef,
      costingType: submission.paymentDetails.costingType,
      paid: submission.paymentDetails.paymentStatus?.status === 'success',
      isExportSubmissionWaiting
    }

    return h.view(pageId, createModel(null, pageData));
  }
},
{
  method: 'POST',
  path: `${currentPath}/finish`,
  handler: async (request, h) => {
    return h.redirect(nextPathMySubmissions)
  },
},
{
  method: 'POST',
  path: `${currentPath}/go-to-export`,
  handler: async (request, h) => {
    return h.redirect(nextPathExportSubmission)
  },
}
]