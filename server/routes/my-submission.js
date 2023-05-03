const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, createApplication } = require('../lib/submission')
const { getSubmissions } = require("../services/dynamics-service")
const textContent = require('../content/text-content')
const pageId = 'my-submission'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/my-submissions`
const nextPathViewApplication = `${urlPrefix}/application-summary/view-submitted`//TO DO
const invalidSubmissionPath = urlPrefix
const pageSize = 15

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmission

  const applicationsData = data.applications
  const applicationsTableData= applicationsData.map(application => {
    const applicationIndex = (application.applicationIndex + 1).toString().padStart(3, '0');
    const referenceNumber = `${data.submissionId}/${applicationIndex}`
    const referenceNumberUrl = `${nextPathViewApplication}/${data.submissionId}/${application.applicationIndex}`
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
        text: data.submissionId,
        href: "#"
      }
    ]
  }

  const model = {
    breadcrumbs: breadcrumbs,
    pageTitle: data.submissionId,
    captionText: data.submissionId,
    tableHeadReferenceNumber: pageContent.tableHeadReferenceNumber,
    tableHeadScientificName: pageContent. tableHeadScientificName,
    applicationsData : applicationsTableData,

    inputPagination: data.totalApplications > pageSize ? paginate(data.submissionId, data.totalApplications, data.pageNo, textPagination) : ""
  }
  return { ...commonContent, ...model }
}


function paginate(submissionId, totalSubmissions, currentPage, textPagination) {
  const totalPages = Math.ceil(totalSubmissions / pageSize);

  const prevAttr = currentPage === 1 ? { 'data-disabled': '' } : null
  const nextAttr = currentPage === totalPages ? { 'data-disabled': '' } : null

  const pagination = {
    id: "pagination",
    name: "pagination",
    previous: {
      href: currentPage === 1 ? "#" : `${currentPath}/${submissionId}/${currentPage - 1}`,
      text: "Previous",
      attributes: prevAttr
    },
    next: {
      href: currentPage === totalPages ? "#" : `${currentPath}/${submissionId}/${currentPage + 1}`,
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
    path: `${currentPath}/{submissionId}/{pageNo?}` ,
    options: {
      validate: {
        params: Joi.object({
          submissionId: Joi.string().required(),
          pageNo: Joi.number().allow('')
        }),
      }
    },
    
    handler: async (request, h) => {
      const submissionId = request.params.submissionId
      const pageNo = request.params.pageNo
      const submission = getSubmission(request)
      const applications = submission?.applications
     
      let startIndex =  null
      if (pageNo) {
        startIndex = (pageNo -1)* pageSize
      } else {
        startIndex = 0
      }
      const endIndex = startIndex + pageSize;
      const slicedApplications = applications?.slice(startIndex, endIndex);

      const pageData = {
        submissionId: submissionId,
        pageNo: pageNo ? pageNo : 1,
        applications: slicedApplications,
        startIndex: startIndex,
        endIndex: endIndex,
        totalApplications: submission?.applications.length,
      }
      return h.view(pageId, createModel(null, pageData))
    }
  }
]

