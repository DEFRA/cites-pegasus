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
const nextPathViewApplication = `${urlPrefix}/application-summary/check`//TO DO
const nextPathCopyApplication = `${urlPrefix}/application-summary/check`//TO DO
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmission

  const submissionsData = data.submissions
  const submissionsTableData= submissionsData.map(submission => {
    const referenceNumberUrl = `${nextPathViewApplication}/${submission.submissionIndex}`
    

    return {referenceNumber: submission.referenceNumber,
            speciesName: application.speciesName, 
            referenceNumberUrl,
            permitType: submission.permitType,
            applicationDate: submission.applicationDate,
            status: submission.status
        }
  })

  const model = {
    backLink: previousPath,
    pageTitle: pageContent.defaultTitle,
    captionText: pageContent.pageHeader,
    tableHeadReferenceNumber: pageContent.tableHeadReferenceNumber,
    tableHeadPermitType: pageContent.tableHeadPermitType,
    tableHeadApplicationDate: pageContent.tableHeadApplicationDate,
    tableHeadStatus: pageContent.tableHeadStatus,
    submissionsData : submissionsTableData,
    
    inputPagination: data.totalSubmissions > pageSize ? paginate(data.totalSubmissions, data.pageNo ? data.pageNo : 1, pageSize, textPagination) : ""


  }
  return { ...commonContent, ...model }
}

function paginate(totalSubmissions, currentPage, pageSize, textPagination) {
    const totalPages = Math.ceil(totalSubmissions / pageSize);
  
    const pagination = {
      id: "pagination",
      name: "pagination",
      previous: {
        href: currentPage === 1 ? "#" : `${currentPath}/${currentPage - 1}`,
        text: "Previous",
      },
      next: {
        href: currentPage === totalPages ?  "#" : `${currentPath}/${currentPage + 1}`,
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


module.exports = [
   //GET for my applications page
   {
    method: "GET",
    path: `${currentPath}/{pageNo?}` ,
    options: {
      validate: {
        params: Joi.object({
          pageNo: Joi.number().allow('')
        }),
      }
    },
    
    handler: async (request, h) => {
      // const contactId = request.auth.credentials.contactId
      const pageNo = request.params.pageNo
      const contactId = "9165f3c0-dcc3-ed11-83ff-000d3aa9f90e"
      let startIndex =  null
      if (pageNo) {
        startIndex = (pageNo -1)* pageSize
      } else {
        startIndex = 0
       
      }
      const submissionsData = await getSubmissions(request, contactId, permitTypes, statuses, startIndex, pageSize)
      const submissions = submissionsData.submissions
      const sessionData = getYarValue(request, 'filterData')

      const pageData = {
        pageNo: pageNo,
        submissions: submissions,
        pageSize: pageSize,
        startIndex: startIndex,
        totalSubmissions: submissionsData.totalSubmissions,
        noApplicationMadeBefore: submissions.length === 0,
        permitTypes: sessionData?.permitTypes,
        statuses: sessionData?.statuses,
        searchTerm: sessionData?.searchTerm,
      }
      return h.view(pageId, createModel(null, pageData))
    }
  },
  
  //GET for Add another species link
  {
    method: "GET",
    path: `${currentPath}/create-application`,
    handler: async (request, h) => {
      const submission = getSubmission(request)
      let appStatuses = null
      try {
        appStatuses = validateSubmission(submission, `${pageId}/create-application`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }      
      
      const inProgressAppStatus = appStatuses.find(appStatus => appStatus.status === 'in-progress')
      
      if(inProgressAppStatus) {
        return h.redirect(`${nextPathspeciesName}/${inProgressAppStatus.applicationIndex}`)
      }

      const applicationIndex = createApplication(request)
      return h.redirect(`${nextPathSpeciesName}/${applicationIndex}`)
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

