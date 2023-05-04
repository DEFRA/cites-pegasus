const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { setYarValue } = require('../lib/session')
const dynamics = require("../services/dynamics-service")
const textContent = require('../content/text-content')
const pageId = 'my-submission'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/my-submissions`
const nextPathViewApplication = `${urlPrefix}/application-summary/view-submitted`//TO DO
const invalidSubmissionPath = `${urlPrefix}/`
const pageSize = 15

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmission

  const applicationsData = data.applications
  const applicationsTableData= applicationsData.map(application => {
    const applicationIndex = (application.applicationIndex + 1).toString().padStart(3, '0');
    const referenceNumber = `${data.submissionRef}/${applicationIndex}`
    const referenceNumberUrl = `${nextPathViewApplication}/${application.applicationIndex}`
    const speciesName= application.species.speciesName
   
    return { referenceNumber, referenceNumberUrl, speciesName}
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

  const model = {
    breadcrumbs: breadcrumbs,
    pageTitle: data.submissionRef,
    captionText: data.submissionRef,
    tableHeadReferenceNumber: pageContent.tableHeadReferenceNumber,
    tableHeadScientificName: pageContent. tableHeadScientificName,
    applicationsData : applicationsTableData,

    inputPagination: data.totalApplications > pageSize ? paginate(data.submissionRef, data.totalApplications, data.pageNo, textPagination) : ""
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
      const submission = await dynamics.getSubmission(request.server, request.auth.credentials.contactId, submissionRef)
      const applications = submission.applications
     
      let startIndex =  null
      if (pageNo) {
        startIndex = (pageNo -1)* pageSize
      } else {
        startIndex = 0
      }
      const endIndex = startIndex + pageSize;
      const slicedApplications = applications.slice(startIndex, endIndex);

      const pageData = {
        submissionRef: submissionRef,
        pageNo: pageNo ? pageNo : 1,
        applications: slicedApplications,
        startIndex: startIndex,
        endIndex: endIndex,
        totalApplications: submission.applications.length,
      }

      submission.submissionRef = submissionRef
      setYarValue(request, 'submission', submission)
      
      return h.view(pageId, createModel(null, pageData))
    }
  }
]

