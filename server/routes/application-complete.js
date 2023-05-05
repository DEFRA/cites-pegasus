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
  const costingTypeContent = data.costingType === 'simple' ? pageContent.simplePayment : pageContent.complexPayment
  const feeAmount = data.costingType === 'simple' ? data.feeAmount : ''
  const model = {
    //backLink: previousPath,
    submissionRef: data.submissionRef,
    formActionPage: currentPath,
    defaultTitle: pageContent.defaultTitle,
    pageBody: pageContent.pageBody,
    pageTitle: pageContent.defaultTitle,

    panelHeading: pageContent.panelHeading + ' - ' + data.costingType.toUpperCase(),//TODO REMOVE PAYMENT TYPE
    feeAmount,
    email: data.email,
    panelText: pageContent.panelText,
    pageHeader: pageContent.pageHeader,
    pageBody1: costingTypeContent.pageBody1,
    pageBody1b:  costingTypeContent.pageBody1b,
    pageBody2: costingTypeContent.pageBody2,
    pageBody3: costingTypeContent.pageBody3,
    pageBody4: costingTypeContent.pageBody4
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

    let email = ''
    if(submission.paymentDetails.paymentStatus?.email){
      email = submission.paymentDetails.paymentStatus.email    
    } else {
      email = submission.isAgent ? submission.agent.email : submission.applicant.email      
    }

    const pageData = {
      submissionRef: submission.submissionRef, 
      costingType: submission.paymentDetails.costingType,
      email,
      feeAmount: submission.paymentDetails.feeAmount
    }

    return h.view(pageId, createModel(null, pageData));
  }
},
{
  method: 'POST',
  path: currentPath,
  handler: async (request, h) => {
    return h.redirect(response.nextUrl)
  },
}
]