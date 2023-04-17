const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { getSubmissions } = require("../services/dynamics-service")
const nunjucks = require("nunjucks")
const textContent = require("../content/text-content")
const pageId = "my-submissions"
const currentPath = `${urlPrefix}/${pageId}`
const nextPathPermitType = `${urlPrefix}/permit-type`
const nextPathMySubmission = `${urlPrefix}/my-submission`
const invalidSubmissionPath = urlPrefix
// const permitTypes = ['import', 'export', 'reexport', 'article10']
// const statuses = ['received','awaiting payment', 'awaiting reply', 'in process', 'issued', 'refused', 'cancelled']



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
      classes: "govuk-button--start govuk-button--search",
      attributes: {
        formAction: currentPath
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

  const textPagination = `${data.startIndex +1} to ${submissionsData.length} of ${data.totalSubmissions} applications`
  
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
    pagebodyNoApplicationsFound: submissionsData.length === 0 ? pageContent.pagebodyNoApplicationsFound : "",
    pagebodyZeroApplication: submissionsData.length === 0 ? pageContent.pagebodyZeroApplication : "",
    formActionStartNewApplication: currentPath,
    formActionApplyFilters: `${currentPath}/filter`,
    
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
  }
  return { ...commonContent, ...model }
}

function getApplicationDate(date) {
  const dateObj = new Date(date);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-GB', options);
  return formattedDate
}

module.exports = [
  //GET for my applications page
  {
    method: "GET",
    path: `${currentPath}`,
    // options: {
    //   validate: {
    //     params: Joi.object({
    //       pageIndex: Joi.number().required()
    //     }),
    //   }
    // },
    
    handler: async (request, h) => {
      // const contactId = request.auth.credentials.contactId
      // const { pageIndex } = request.params
      const contactId = "9165f3c0-dcc3-ed11-83ff-000d3aa9f90e"
      const pageSize = 15
      const startIndex = 0
      const permitTypes = ['import', 'export', 'reexport', 'article10']
      const statuses = ['received','awaitingPayment', 'awaitingReply', 'inProcess', 'issued', 'refused', 'cancelled']

      const submissionsData = await getSubmissions(request, contactId, permitTypes, statuses, startIndex, pageSize)
      const submissions = submissionsData.submissions

      try {
        validateSubmission(submissions, pageId)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const pageData = {
        // pageIndex: pageIndex,
        submissions: submissions,
        pageSize: pageSize,
        startIndex: startIndex,
        totalSubmissions: submissionsData.totalSubmissions,
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
        return h.redirect(nextPathPermitType)
      }
  },
   //POST for start new application button
   {
    method: "POST",
    path: `${currentPath}/filter`,
    options: {
      validate: {
        options: { abortEarly: false },
        payload: Joi.object({
          searchTerm: Joi.string().allow(''),
          permitTypes: Joi.array().items(Joi.string().valid('import', 'export', 'reexport', 'article10')),
          statuses: Joi.array().items(Joi.string().valid('received', 'awaitingPayment', 'awaitingReply', 'inProcess', 'issued', 'refused', 'cancelled'))
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      },
      handler: async (request, h) => {
       // const contactId = request.auth.credentials.contactId
      const contactId = "9165f3c0-dcc3-ed11-83ff-000d3aa9f90e"
      const pageSize = 15
      const startIndex = 0
      const permitTypes = request.payload.permitTypes
      const statuses= request.payload.statuses

      const submissionsData = await getSubmissions(request, contactId, permitTypes, statuses, startIndex, pageSize)
      const submissions = submissionsData.submissions

      const pageData = {
        // pageIndex: pageIndex,
        submissions: submissions,
        pageSize: pageSize,
        startIndex: startIndex,
        totalSubmissions: submissionsData.totalSubmissions,
        permitTypes: permitTypes,
        statuses: statuses
      }
      return h.view(pageId, createModel(null, pageData))
      }
    }
  },


]

