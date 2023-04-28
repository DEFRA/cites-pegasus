const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, createApplication } = require('../lib/submission')
const { getSubmissions } = require("../services/dynamics-service")
const textContent = require('../content/text-content')
const pageId = 'my-submission'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/my-submissions`
const nextPathUploadSupportingDocuments = `${urlPrefix}/upload-supporting-documents`
const nextPathViewApplication = `${urlPrefix}/application-summary/view-submitted`//TO DO
const invalidSubmissionPath = urlPrefix
const pageSize = 10

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmission

  // let status = null
  // switch (data.status) {
  //   case "received":
  //     status = pageContent.rowTextReceived
  //     break
  //   case "awaitingPayment":
  //     status = pageContent.rowTextAwaitingPayment
  //     break
  //   case "awaitingReply":
  //     status = pageContent.rowTextAwaitingReply
  //     break
  //   case "inProcess":
  //     status = pageContent.rowTextInProcess
  //     break
  //   case "issued":
  //     status = pageContent.rowTextIssued
  //     break
  //   case "refused":
  //     status = pageContent.rowTextRefused
  //     break
  //   case "cancelled":
  //     status = pageContent.rowTextCancelled
  //     break
  // }
  // let permitType = null
  // switch (data.permitType) {
  //   case "import":
  //     permitType = pageContent.rowTextImport
  //     break
  //   case "export":
  //     permitType = pageContent.rowTextExport
  //     break
  //   case "reexport":
  //     permitType = pageContent.rowTextReexport
  //     break
  //   case "article10":
  //     permitType = pageContent.rowTextArticle10
  //     break
  //   case "issued":
  //     permitType = pageContent.rowTextIssued
  //     break
  // }

  // const applicationDate = getApplicationDate(data.dateSubmitted)
  // const applicationsData = data.applications
  // const applicationsTableData= applicationsData.map(application => {
  //   const referenceNumberUrl = `${nextPathViewApplication}/${data.submissionId}/${application.applicationIndex}`
  //   return {referenceNumber: `${data.submissionId}/${application.applicationIndex}`,
  //           referenceNumberUrl,
  //           speciesName: application.speciesName, 
  //           permitType: permitType,
  //           applicationDate: applicationDate,
  //           status: status
  //       }
  // })

  // const textPagination = `${data.startIndex + 1} to ${endIndex} of ${data.totalApplications}`

  const model = {
    firstBreadcrumbsText: pageContent.textBreadcrumbs,
    firstBreadcrumbsUrl: previousPath,
    secondBreadcrumbsText: pageContent.textBreadcrumbs,
    secondBreadcrumbsUrl: previousPath,
    pageTitle: data.submissionId,
    captionText: data.submissionId,
    tableHeadReferenceNumber: pageContent.tableHeadReferenceNumber,
    tableHeadPermitType: pageContent.tableHeadPermitType,
    tableHeadApplicationDate: pageContent.tableHeadApplicationDate,
    tableHeadStatus: pageContent.tableHeadStatus,
    // applicationsData : applicationsTableData,

    // inputPagination: data.totalApplications > pageSize ? paginate(data.totalApplications, data.pageNo, textPagination) : ""

  }
  return { ...commonContent, ...model }
}

function paginate(totalApplications, pageNo, textPagination) {
    const totalPages = Math.ceil(totalApplications / pageSize);
  
    const pagination = {
      id: "pagination",
      name: "pagination",
      previous: {
        href: pageNo === 1 ? "#" : `${currentPath}/${pageNo - 1}`,
        text: "Previous",
      },
      next: {
        href: pageNo === totalPages ?  "#" : `${currentPath}/${pageNo + 1}`,
        text: "Next",
      },
      items: [{
        number: textPagination
      }],
    };
  
    // if (currentPage === 1) {
    //   pagination.previous.disabled = true;
    // }
  
    // if (currentPage === totalPages) {
    //   pagination.next.disabled = true;
    // }
  
    return pagination;
  }

  function getApplicationDate(date) {
    const dateObj = new Date(date);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString('en-GB', options);
    return formattedDate
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
      // const contactId = request.auth.credentials.contactId
      const submissionId = request.params.submissionId
      const pageNo = request.params.pageNo
      const contactId = "9165f3c0-dcc3-ed11-83ff-000d3aa9f90e"
     
      const submission = await getSubmissions(request, contactId, submissionId)
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
        // applications: slicedApplications,
        // permitType: submission?.permitType,
        // applicationDate: submission?.dateSubmitted,
        // status: submission?.status,
        // startIndex: startIndex,
        // totalApplications: submission?.applications.length,
      }
      return h.view(pageId, createModel(null, pageData))
    }
  },
  
 //POST for my submission page
  {
    method: "POST",
    path: `${currentPath}`,
    options: {
      validate: {
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const appStatuses = validateSubmission(submission, null)
          const completeApplications = getCompleteApplications(submission, appStatuses)

          const pageData = {
            permitType: submission.permitType,
            applications : completeApplications
          }
          return h.view(pageId, createSubmitApplicationModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        return h.redirect(nextPathUploadSupportingDocuments)
      }
    }
  },
 
  
  
]

