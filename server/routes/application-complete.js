const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { getSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const pageId = 'application-complete'
const currentPath = `${urlPrefix}/${pageId}`
//const previousPath = `${urlPrefix}/`
const nextPath = `${urlPrefix}/`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.applicationComplete
  const costingTypeContent = data.paid ? pageContent.paid : pageContent.notPaid

  const panelContent = {
    titleText: pageContent.panelHeading,
    html: `${pageContent.panelText}<br><strong>${data.submissionRef}</strong>`
  }

  const model = {
    formActionPage: currentPath,
    defaultTitle: pageContent.defaultTitle,
    pageBody: pageContent.pageBody,
    pageTitle: pageContent.defaultTitle,
    panelContent: panelContent,
    pageHeader: pageContent.pageHeader,
    pageBody1: costingTypeContent.pageBody1,
    pageBody2: costingTypeContent.pageBody2,
    pageBody3: costingTypeContent.pageBody3
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

    console.log(submission.paymentDetails)

    const pageData = {
      submissionRef: submission.submissionRef, 
      costingType: submission.paymentDetails.costingType,
      //email,
      costingValue: submission.paymentDetails.costingValue,
      paid: submission.paymentDetails.paymentStatus?.status === 'success'
    }

    return h.view(pageId, createModel(null, pageData));
  }
},
{
  method: 'POST',
  path: currentPath,
  handler: async (request, h) => {
    return h.redirect(nextPath)
  },
}
]