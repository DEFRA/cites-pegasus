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
  let pageBodyContent
  
  if(data.paid) {
    pageBodyContent = pageContent.paid
   } else {
    pageBodyContent = data.costingType === 'simple' ? pageContent.notPaid.simple : pageContent.notPaid.complex
   }



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
    pageBody1: pageBodyContent.pageBody1,
    pageBody2: pageBodyContent.pageBody2,
    pageBody3: pageBodyContent.pageBody3,
    pageBody4: pageBodyContent.pageBody4
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

    const pageData = {
      submissionRef: submission.submissionRef, 
      costingType: submission.paymentDetails.costingType,
      //email,
      costingValue: submission.paymentDetails.costingValue,
      paid: submission.paymentDetails.paymentStatus?.status === 'success',
      costingType: submission.paymentDetails.costingType
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