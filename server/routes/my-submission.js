const Joi = require('joi')
const { urlPrefix, enableInternalReference } = require("../../config/config")
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { setYarValue, getYarValue } = require('../lib/session')
const dynamics = require("../services/dynamics-service")
const user = require('../lib/user')
const textContent = require('../content/text-content')
const pageId = 'my-submission'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/my-submissions`
const nextPathViewApplication = `${urlPrefix}/application-summary/view-submitted`
const invalidSubmissionPath = `${urlPrefix}/`
const pageSize = 15

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmission

  const applicationsData = data.applications
  const hasPendingApplications = applicationsData.some(application => !application.applicationRef)

  const applicationsTableData= applicationsData.map(application => {
    const referenceNumber = application.applicationRef
    
    const referenceNumberUrl = `${nextPathViewApplication}/${application.applicationIndex}`
    const speciesName = application.species.speciesName
    const internalReference = application.internalReference
   
    return { referenceNumber, referenceNumberUrl, speciesName, internalReference}
  })

  const startIndex = (data.pageNo - 1) * pageSize
  const endIndex = data.totalApplications <= startIndex + pageSize ? data.totalApplications : startIndex + pageSize

  const textPagination = `${startIndex + 1} to ${endIndex} of ${data.totalApplications}`

  const breadcrumbs = {
    items: [
      {
        text: pageContent.textBreadcrumbs,
        href: previousPath,
      },
      {
        text: data.submissionRef,
        href: "#"
      }
    ]
  }
  const paymentLink = `${urlPrefix}/govpay/create-payment/account`  

  const notificationHeader = pageContent.notificationHeader.replace('##COST##', data.cost)
  const notificationContent = pageContent.notificationContent.replace('##PAYMENT_LINK##', paymentLink)

  const model = {
    breadcrumbs: breadcrumbs,
    notificationHeader: notificationHeader,
    notificationContent: notificationContent,
    enableInternalReference,
    pageTitle: data.submissionRef + commonContent.pageTitleSuffix,
    pageHeader: data.submissionRef,
    tableHeadReferenceNumber: pageContent.tableHeadReferenceNumber,
    tableHeadScientificName: pageContent.tableHeadScientificName,
    tableHeadInternalReference: pageContent.tableHeadInternalReference,
    pendingApplicationsBodyText: pageContent.pendingApplicationsBodyText,
    applicationsData : applicationsTableData,
    showPayNowNotification: data.showPayNowNotification,
    inputPagination: data.totalApplications > pageSize ? paginate(data.submissionRef, data.totalApplications, data.pageNo, textPagination) : "",
    hasPendingApplications: hasPendingApplications
  }
  return { ...commonContent, ...model }
}


function paginate(submissionRef, totalSubmissions, currentPage, textPagination) {
  const totalPages = Math.ceil(totalSubmissions / pageSize);

  const prevAttr = currentPage === 1 ? { 'data-disabled': '' } : null
  const nextAttr = currentPage === totalPages ? { 'data-disabled': '' } : null

  const pagination = {
    id: "pagination",
    name: "pagination",
    previous: {
      href: currentPage === 1 ? "#" : `${currentPath}/${submissionRef}/${currentPage - 1}`,
      text: "Previous",
      attributes: prevAttr
    },
    next: {
      href: currentPage === totalPages ? "#" : `${currentPath}/${submissionRef}/${currentPage + 1}`,
      text: "Next",
      attributes: nextAttr
    },
    items: [{
      number: textPagination
    }],
  };

  return pagination;
}
  
module.exports = [
   //GET for my submission page
   {
    method: "GET",
    path: `${currentPath}/{submissionRef}/{pageNo?}` ,
    options: {
      validate: {
        params: Joi.object({
          submissionRef: Joi.string().required(),
          pageNo: Joi.number().allow('')
        }),
      }
    },
    
    handler: async (request, h) => {
      const submissionRef = request.params.submissionRef
      const pageNo = request.params.pageNo
      const { user: { organisationId } } = getYarValue(request, 'CIDMAuth')  

      let contactId = request.auth.credentials.contactId
      if(user.hasOrganisationWideAccess(request)) {
        contactId = null
      }
      const submission = await dynamics.getSubmission(request.server, contactId, organisationId, submissionRef)
      const applications = submission.applications
     
      let startIndex =  null
      if (pageNo) {
        startIndex = (pageNo -1)* pageSize
      } else {
        startIndex = 0
      }
      const endIndex = startIndex + pageSize
      const slicedApplications = applications.slice(startIndex, endIndex)

      let showPayNowNotification = false
      
      if(submission.paymentDetails.feePaid === false && submission.submissionStatus === 'awaitingPayment' && submission.paymentDetails.costingValue > 0){
           showPayNowNotification = true
      }
      
      const pageData = {
        submissionRef,
        pageNo: pageNo || 1,
        applications: slicedApplications,
        startIndex,
        endIndex,
        totalApplications: submission.applications.length,
        showPayNowNotification,
        cost: submission.paymentDetails?.costingValue
      }

      setYarValue(request, 'submission', submission)
      
      return h.view(pageId, createModel(null, pageData))
    }
  }
]

