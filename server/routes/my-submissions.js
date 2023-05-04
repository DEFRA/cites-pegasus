const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getYarValue, setYarValue } = require('../lib/session')
const { getSubmission, mergeSubmission, validateSubmission, createSubmission } = require("../lib/submission")
const dynamics = require("../services/dynamics-service")
const nunjucks = require("nunjucks")
const textContent = require("../content/text-content")
const pageId = "my-submissions"
const currentPath = `${urlPrefix}/${pageId}`
const nextPathPermitType = `${urlPrefix}/permit-type`
const nextPathMySubmission = `${urlPrefix}/my-submission`
const invalidSubmissionPath = urlPrefix
const permitTypes = ['import', 'export', 'reexport', 'article10']
const statuses = ['received', 'awaitingPayment', 'awaitingReply', 'inProcess', 'issued', 'refused', 'cancelled']
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
        formAction: `${currentPath}`
      }
    }
  })


  const submissionsData = data.submissions

  const statusTextMap = {
    received: pageContent.rowTextReceived,
    awaitingPayment: pageContent.rowTextAwaitingPayment,
    awaitingReply: pageContent.rowTextAwaitingReply,
    inProcess: pageContent.rowTextInProcess,
    issued: pageContent.rowTextIssued,
    refused: pageContent.rowTextRefused,
    cancelled: pageContent.rowTextCancelled,
  };

  const submissionsTableData = submissionsData.map(submission => {
    const referenceNumber = submission.submissionRef
    const referenceNumberUrl = `${currentPath}/select/${referenceNumber}`
    const applicationDate = getApplicationDate(submission.dateSubmitted)
    const status = statusTextMap[submission.status] || submission.status

    return { referenceNumber, referenceNumberUrl, applicationDate, status }
  })

  const startIndex = (data.pageNo - 1) * pageSize
  const endIndex = data.totalSubmissions <= startIndex + pageSize ? data.totalSubmissions : startIndex + pageSize

  const textPagination = `${startIndex + 1} to ${endIndex} of ${data.totalSubmissions}`

  let pagebodyNoApplicationsFound = null
  if (data.noApplicationMadeBefore && submissionsData.length === 0) {
    pagebodyNoApplicationsFound = pageContent.pagebodyZeroApplication
  } else if ((data.noApplicationFound || data.noMatchingApplication) && submissionsData.length === 0) {
    pagebodyNoApplicationsFound = pageContent.pagebodyNoApplicationsFound
  }

  const breadcrumbs = {
    items: [
      {
        text: pageContent.pageHeader,
        href: "#"
      }
    ]
  }

  const model = {
    breadcrumbs: breadcrumbs,
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
    //textPagination: textPagination,
    pagebodyNoApplicationsFound: pagebodyNoApplicationsFound,
    formActionStartNewApplication: `${currentPath}/new-application`,
    formActionApplyFilters: `${currentPath}`,
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
        classes: "govuk-input__suffix--search",
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
        },
        {
          value: "closed",
          text: pageContent.checkboxLabelClosed,
          checked: isChecked(data.statuses, "closed")
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

  const prevAttr = currentPage === 1 ? { 'data-disabled': '' } : null
  const nextAttr = currentPage === totalPages ? { 'data-disabled': '' } : null


  const pagination = {
    id: "pagination",
    name: "pagination",
    previous: {
      href: currentPage === 1 ? "#" : `${currentPath}/${currentPage - 1}`,
      text: "Previous",
      attributes: prevAttr
    },
    next: {
      href: currentPage === totalPages ? "#" : `${currentPath}/${currentPage + 1}`,
      text: "Next",
      attributes: nextAttr
    },
    items: [{
      number: textPagination
    }],
  };

  return pagination;
}

async function getSubmissionsData(request, pageNo, filterData) {
  let queryUrls = getYarValue(request, 'mySubmissions-queryUrls')

  if (!queryUrls) {
    const searchTerm = filterData?.searchTerm ? filterData?.searchTerm.toUpperCase() : ''

    const queryUrl = await dynamics.getNewSubmissionsQueryUrl(request.auth.credentials.contactId, filterData?.permitTypes, filterData?.statuses, searchTerm)
    queryUrls = [queryUrl]
  }

  if (pageNo > queryUrls.length || pageNo < 1) {
    console.log("Invalid page number")
    return h.redirect('/404')
  }

  const { submissions, nextQueryUrl, totalSubmissions } = await dynamics.getSubmissions(request.server, queryUrls[pageNo - 1], pageSize)

  if (nextQueryUrl && queryUrls.length === pageNo) {
    queryUrls.push(nextQueryUrl)
  }

  setYarValue(request, 'mySubmissions-queryUrls', queryUrls)

  return { submissions, totalSubmissions }
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
    path: `${currentPath}/{pageNo?}`,
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

      if (!pageNo) {
        setYarValue(request, 'mySubmissions-queryUrls', null)
        setYarValue(request, 'mySubmissions-filterData', null)
        return h.redirect(`${currentPath}/1`)
      }

      const filterData = getYarValue(request, 'mySubmissions-filterData')

      const { submissions, totalSubmissions } = await getSubmissionsData(request, pageNo, filterData)

      const pageData = {
        pageNo: pageNo,
        submissions: submissions,
        pageSize: pageSize,
        totalSubmissions: totalSubmissions,
        noApplicationMadeBefore: submissions.length === 0,
        permitTypes: filterData?.permitTypes,
        statuses: filterData?.statuses,
        searchTerm: filterData?.searchTerm,
      }
      return h.view(pageId, createModel(null, pageData))
    }
  },
  //POST for start new application button
  {
    method: "POST",
    path: `${currentPath}/new-application`,
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
    path: currentPath,
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

        const pageNo = 1

        let permitTypes = null

        if (request.payload.permitTypes) {
          if (Array.isArray(request.payload.permitTypes)) {
            permitTypes = request.payload.permitTypes
          } else {
            permitTypes = [request.payload.permitTypes]
          }
        }

        const filterData = {
          permitTypes: permitTypes,
          statuses: request.payload.statuses,
          searchTerm: request.payload.searchTerm
        }

        try {
          setYarValue(request, 'mySubmissions-queryUrls', null)
          setYarValue(request, 'mySubmissions-filterData', filterData)
        } catch (err) {
          console.log(err)
          return h.redirect(invalidSubmissionPath)
        }

        const { submissions, totalSubmissions } = await getSubmissionsData(request, pageNo, filterData)

        const pageData = {
          pageNo: pageNo,
          submissions: submissions,
          pageSize: pageSize,
          totalSubmissions: totalSubmissions,
          permitTypes: filterData.permitTypes,
          statuses: filterData.statuses,
          searchTerm: filterData.searchTerm,
          noApplicationFound: submissions.length === 0
        }

        return h.view(pageId, createModel(null, pageData))
      }
    }
  },
  {
    method: "GET",
    path: `${currentPath}/select/{submissionRef}`,
    options: {
      validate: {
        params: Joi.object({
          submissionRef: Joi.string().allow('')
        }),
      }
    },

    handler: async (request, h) => {
      const submissionRef = request.params.submissionRef
      const submission = await dynamics.getSubmission(request.server, request.auth.credentials.contactId, submissionRef)
      submission.submissionRef = submissionRef
     
      setYarValue(request, 'submission', submission)

      return h.redirect(`${nextPathMySubmission}/${submissionRef}`)
    }
  },
]

