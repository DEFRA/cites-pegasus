const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { getSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const { permitType: pt } = require('../lib/permit-type-helper')
const pageId = 'application-complete'
const currentPath = `${urlPrefix}/${pageId}`
//const previousPath = `${urlPrefix}/`
const nextPathMySubmissions = `${urlPrefix}/`
const nextPathExportSubmission = `${urlPrefix}/my-submissions/draft-continue`
const { getPermitDescription } = require("../lib/permit-type-helper")
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.applicationComplete
  
  const pageBodyContent = getPageBodyContent(pageContent, data)
  const permitDescription = getPermitDescription(data.permitType, data.permitSubType)

  const permitTypeText = [pt.ARTICLE_10, pt.MIC, pt.TEC, pt.POC].includes(data.permitType) || permitDescription.endsWith(pageContent.permitTypeSuffix) ? permitDescription : permitDescription + ' ' + pageContent.permitTypeSuffix

  const panelContent = {
    titleText: pageContent.panelHeading.replace('##PERMIT_TYPE##', permitTypeText),
    html: `${pageContent.panelText}<br><strong>${data.submissionRef}</strong>`
  }


  const model = {
    isExportSubmissionWaiting: data.isExportSubmissionWaiting,
    formActionPage: currentPath,
    pageBody: pageContent.pageBody,
    pageTitle: pageContent.defaultTitle.replace('##PERMIT_TYPE##', permitTypeText) + commonContent.pageTitleSuffix,
    panelContent: panelContent,
    pageHeader: pageContent.pageHeader,
    pageHeader2: pageBodyContent.pageHeader2,
    pageBody1: pageBodyContent.pageBody1,
    pageBodyWarning1: pageBodyContent.pageBodyWarning1,
    pageBodyWarning2: pageBodyContent.pageBodyWarning2,
    pageBody2: pageBodyContent.pageBody2,
    pageBody3: pageBodyContent.pageBody3,
    pageBody4: pageBodyContent.pageBody4,
    pageBody5: pageBodyContent.pageBody5,
    pageBody6: pageBodyContent.pageBody6,
    buttonGoToExportSubmission: pageContent.buttonGoToExportSubmission,
    buttonGoToMyAccount: pageContent.buttonGoToMyAccount,
    formActionGoToAccount: currentPath + '/go-to-account',
    formActionGoToExport: currentPath + '/go-to-export'
  }

  return { ...commonContent, ...model }
}

function getPageBodyContent(pageContent, data) {
  let pageBodyContent

  if (data.isExportSubmissionWaiting) {
    if (data.paid) {
      pageBodyContent = pageContent.exportSubmission.paid
    } else {
      pageBodyContent = data.costingType === 'simple' ? pageContent.exportSubmission.notPaid.simple : pageContent.exportSubmission.notPaid.complex
    }
  } else {
    if (data.paid) {
      pageBodyContent = pageContent.noExportSubmission.paid
    } else {
      pageBodyContent = data.costingType === 'simple' ? pageContent.noExportSubmission.notPaid.simple : pageContent.noExportSubmission.notPaid.complex
    }
  }
  return pageBodyContent
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
      isExportSubmissionWaiting,
      permitType: submission.permitType,
      permitSubType: submission.applications[0].permitSubType      
    }

    return h.view(pageId, createModel(null, pageData));
  }
},
{
  method: 'POST',
  path: `${currentPath}/go-to-account`,
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