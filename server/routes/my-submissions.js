const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getYarValue, setYarValue } = require('../lib/session')
const { getSubmission, mergeSubmission, validateSubmission, createSubmission } = require("../lib/submission")
const { getSubmissions } = require("../services/dynamics-service")
const nunjucks = require("nunjucks")
const textContent = require("../content/text-content")
const pageId = "my-submissions"
const currentPath = `${urlPrefix}/${pageId}`
const nextPathPermitType = `${urlPrefix}/permit-type`
const nextPathMySubmission = `${urlPrefix}/my-submission`
const invalidSubmissionPath = urlPrefix
const permitTypes = ['import', 'export', 'reexport', 'article10']
const statuses = ['received','awaitingPayment', 'awaitingReply', 'inProcess', 'issued', 'refused', 'cancelled']
const pageSize = 15


function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmissions

  var renderString = "{% from 'govuk/components/button/macro.njk' import govukButton %} \n {{govukButton(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const searchButton = nunjucks.renderString(renderString, {
    input: {
      id: "searchButton",
      name: "searchButton",
      type: "submit",
      classes: "govuk-button--search",
      html: '<svg class="gem-c-search__icon" width="20" height="20" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><circle cx="12.0161" cy="11.0161" r="8.51613" stroke="currentColor" stroke-width="3"></circle><line x1="17.8668" y1="17.3587" x2="26.4475" y2="25.9393" stroke="currentColor" stroke-width="3"></line></svg>',
      attributes: {
        formAction: `${currentPath}/filter`
      } 
    }
  })

  
  const submissionsData = data.submissions
  const submissionsTableData= submissionsData.map(submission => {
    const referenceNumber = submission.submissionId
    const referenceNumberUrl = `${nextPathMySubmission}/${referenceNumber}`
    const applicationDate = getApplicationDate(submission.dateSubmitted)
    let status = null

    switch (submission.status) {
      case "received":
        status = pageContent.rowTextReceived
        break
      case "awaitingPayment":
        status = pageContent.rowTextAwaitingPayment
        break
      case "awaitingReply":
        status = pageContent.rowTextAwaitingReply
        break
      case "inProcess":
        status = pageContent.rowTextInProcess
        break
      case "issued":
        status = pageContent.rowTextIssued
        break
      case "refused":
        status = pageContent.rowTextRefused
        break
      case "cancelled":
        status = pageContent.rowTextCancelled
        break
    }
    return {referenceNumber, referenceNumberUrl, applicationDate, status}
  })

  const endIndex = data.totalSubmissions <= data.startIndex + pageSize ? data.totalSubmissions : data.startIndex + pageSize

  const textPagination = `${data.startIndex + 1} to ${endIndex} of ${data.totalSubmissions}`

  let pagebodyNoApplicationsFound = null
  if (data.noApplicationMadeBefore && submissionsData.length === 0) {
    pagebodyNoApplicationsFound = pageContent.pagebodyZeroApplication
  } else if ((data.noApplicationFound  || data.noMatchingApplication) && submissionsData.length === 0) {
    pagebodyNoApplicationsFound = pageContent.pagebodyNoApplicationsFound
  } 

  const model = {
    backLink: currentPath,
    pageTitle: pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    clearSearchLinkText: pageContent.linkTextClearSearch,
    clearSearchUrl: currentPath,
    buttonStartNewApplication: pageContent.buttonStartNewApplication,
    headerFilters: pageContent.heading1,
    pageBodyPermitType: pageContent.pageBodyPermitType,
    pageBodyStatus: pageContent.pageBodyStatus,
    buttonApplyFilters: pageContent.buttonApplyFilters,
    submissionsData: submissionsTableData,
    tableHeadReferenceNumber: pageContent.rowTextReferenceNumber,
    tableHeadApplicationDate: pageContent.rowTextApplicationDate,
    tableHeadStatus: pageContent.rowTextStatus,
    textPagination: textPagination,
    pagebodyNoApplicationsFound: pagebodyNoApplicationsFound,
    formActionStartNewApplication: currentPath,
    formActionApplyFilters: `${currentPath}/filter`,
    // hrefPrevious:  currentPage === 1 ? "#" : `${currentPath}/${currentPage - 1}`,
    // hrefNext: currentPage === totalPages ? "#" :`${currentPath}/${currentPage + 1}`,
    // textPagination: textPagination,
    
    inputSearch: {
      id: "searchTerm",
      name: "searchTerm",
      classes: "govuk-grid-column-one-half",
      inputmode: "search",
      label: {
        text: pageContent.inputLabelSearch
      },
      suffix: {
        classes:"govuk-input__suffix--search",
        html: searchButton
      },
      ...(data.searchTerm ? { value: data.searchTerm } : {}),
    },

    checkboxPermitType: {
      idPrefix: "permitTypes",
      name: "permitTypes",
      items: [
        {
          value: "import",
          text: pageContent.checkboxLabelImport,
          checked: isChecked(data.permitTypes, "import")
        },
        {
          value: "export",
          text: pageContent.checkboxLabelExport,
          checked: isChecked(data.permitTypes, "export")
        },
        {
          value: "reexport",
          text: pageContent.checkboxLabelReexport,
          checked: isChecked(data.permitTypes, "reexport")
        },
        {
          value: "article10",
          text: pageContent.checkboxLabelArticle10,
          checked: isChecked(data.permitTypes, "article10")
        }
      ],
    },
   
    checkboxStatus: {
      idPrefix: "statuses",
      name: "statuses",
      items: [
        {
          value: "received",
          text: pageContent.checkboxLabelReceived,
          checked: isChecked(data.statuses, "received")
        },
        {
          value: "awaitingPayment",
          text: pageContent.checkboxLabelAwaitingPayment,
          checked: isChecked(data.statuses, "awaitingPayment")
        },
        {
          value: "awaitingReply",
          text: pageContent.checkboxLabelAwaitingReply,
          checked: isChecked(data.statuses, "awaitingReply")
        },
        {
          value: "inProcess",
          text: pageContent.checkboxLabelInProcess,
          checked: isChecked(data.statuses, "inProcess")
        },
        {
          value: "issued",
          text: pageContent.checkboxLabelIssued,
          checked: isChecked(data.statuses, "issued")
        },
        {
          value: "refused",
          text: pageContent.checkboxLabelRefused,
          checked: isChecked(data.statuses, "refused")
        },
        {
          value: "cancelled",
          text: pageContent.checkboxLabelCancelled,
          checked: isChecked(data.statuses, "cancelled")
        }
      ],
    },

    inputPagination: data.totalSubmissions > pageSize ? paginate(data.totalSubmissions, data.pageNo ? data.pageNo : 1, pageSize, textPagination) : ""
  }
  return { ...commonContent, ...model }
}

function getApplicationDate(date) {
  const dateObj = new Date(date);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-GB', options);
  return formattedDate
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
  {
    method: 'GET',
    path: `${urlPrefix}/`,
    handler: (request, h) => {
      return h.redirect(currentPath)// view(pageId, createModel()); 
    }
  },
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

      try {
        validateSubmission(submissions, pageId)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

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
  //POST for start new application button
  {
    method: "POST",
    path: currentPath,
    options: {
      validate: {
        failAction: (request, h, error) => {
          console.log(error)
        }
      },
    },
      handler: async (request, h) => {      
        createSubmission(request)
        return h.redirect(`${nextPathPermitType}`)
      }
  },
   //POST for apply filter button and search button
   {
    method: "POST",
    path: `${currentPath}/filter`,
    options: {
      validate: {
        options: { abortEarly: false },
        payload: Joi.object({
          searchTerm: Joi.string().allow(''),
          searchButton: Joi.string().allow(''),
          permitTypes: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string().valid(...permitTypes))
          ),
          statuses: 
          Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string().valid(...statuses))
          ),
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      },
      handler: async (request, h) => {
       // const contactId = request.auth.credentials.contactId
      const contactId = "9165f3c0-dcc3-ed11-83ff-000d3aa9f90e"
      const startIndex = 0
      const permitTypes = request.payload.permitTypes
      const statuses= request.payload.statuses
      const searchTerm = request.payload.searchTerm.toUpperCase()

      const submissionsData = await getSubmissions(request, contactId, permitTypes, statuses, startIndex, pageSize, searchTerm)
      const submissions = submissionsData.submissions

      const pageData = {
        // pageIndex: pageIndex,
        submissions: submissions,
        pageSize: pageSize,
        startIndex: startIndex,
        totalSubmissions: submissionsData.totalSubmissions,
        permitTypes: permitTypes,
        statuses: statuses,
        searchTerm: searchTerm,
        noApplicationFound: submissions.length === 0
      }

      const filterData = {
        permitTypes: permitTypes,
        statuses: statuses,
        searchTerm: searchTerm
      }

      try {
       const sessionData= setYarValue(request, 'filterdata', filterData)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      return h.view(pageId, createModel(null, pageData))
      }
    }
  },
 
]

