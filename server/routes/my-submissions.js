const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { permitType: pt } = require('../lib/permit-type-helper')
const { clearChangeRoute } = require('../lib/change-route')
const { getYarValue, setYarValue, sessionKey } = require('../lib/session')
const user = require('../lib/user')
const { createSubmission, getDraftSubmissionDetails, loadDraftSubmission, deleteDraftSubmission } = require('../lib/submission')
const dynamics = require('../services/dynamics-service')
const textContent = require('../content/text-content')
const pageId = 'my-submissions'
const areYouSureViewName = 'application-yes-no-layout'
const currentPath = `${urlPrefix}/${pageId}`
const nextPathPermitType = `${urlPrefix}/permit-type`
const nextPathMySubmission = `${urlPrefix}/my-submission`
const draftContinuePath = `${currentPath}/draft-continue`
const draftDeletePath = `${currentPath}/draft-delete`
const draftSubmissionWarning = `${urlPrefix}/draft-submission-warning/new`
const invalidSubmissionPath = `${urlPrefix}/`
const permitTypes = [pt.IMPORT, pt.EXPORT, pt.REEXPORT, pt.ARTICLE_10]
const statuses = ['awaitingPayment', 'awaitingAdditionalPayment', 'inProgress', 'closed']

const pageSize = 15

function createModel (data) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmissions

  const submissionsData = data.submissions

  const statusTextMap = {
    received: commonContent.statusDescriptionReceived,
    awaitingPayment: commonContent.statusDescriptionAwaitingPayment,
    awaitingAdditionalPayment: commonContent.statusDescriptionAwaitingAdditionalPayment,
    awaitingReply: commonContent.statusDescriptionAwaitingReply,
    inProgress: commonContent.statusDescriptionInProgress,
    issued: commonContent.statusDescriptionIssued,
    refused: commonContent.statusDescriptionRefused,
    cancelled: commonContent.statusDescriptionCancelled,
    closed: commonContent.statusDescriptionClosed
  }

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

  const { pagebodyNoApplicationsFound, pageBodyNewApplicationFromPrevious } = getPageBodyContent(data, pageContent)

  const pageHeader = data.organisationName ? pageContent.pageHeaderOrganisation.replace('##ORGANISATION_NAME##', data.organisationName) : pageContent.pageHeader
  const pageTitle = (data.organisationName ? pageContent.defaultTitleOrganisation.replace('##ORGANISATION_NAME##', data.organisationName) : pageContent.defaultTitle) + commonContent.pageTitleSuffix
  const model = {
    pageTitle,
    pageHeader,
    draftNotificationTitle: pageContent.draftNotificationTitle,
    draftNotificationHeader: data.draftSubmissionDetail.a10SourceSubmissionRef ? pageContent.draftNotificationHeaderExportSubmission : pageContent.draftNotificationHeader,
    draftNotificationBody: data.draftSubmissionDetail.a10SourceSubmissionRef ? pageContent.draftNotificationBodyExportSubmission : pageContent.draftNotificationBody,
    draftContinue: pageContent.draftContinue,
    draftDelete: pageContent.draftDelete,
    draftContinuePath: draftContinuePath,
    draftDeletePath: draftDeletePath,
    clearSearchLinkText: pageContent.linkTextClearSearch,
    currentPath: currentPath,
    buttonStartNewApplication: pageContent.buttonStartNewApplication,
    pageBodyNewApplicationFromPrevious,
    headerFilters: pageContent.heading1,
    pageBodyPermitType: pageContent.pageBodyPermitType,
    pageBodyStatus: pageContent.pageBodyStatus,
    pageBodySubmittedBy: pageContent.pageBodySubmittedBy,
    buttonApplyFilters: pageContent.buttonApplyFilters,
    draftSubmissionDetail: data.draftSubmissionDetail,
    submissionsData: submissionsTableData,
    tableHeadReferenceNumber: pageContent.rowTextReferenceNumber,
    tableHeadApplicationDate: pageContent.rowTextApplicationDate,
    tableHeadStatus: pageContent.rowTextStatus,
    pagebodyNoApplicationsFound: pagebodyNoApplicationsFound,
    formActionStartNewApplication: `${currentPath}/new-application`,
    organisationName: data.organisationName,
    ...getInputs(pageContent, commonContent, data, textPagination)
  }
  return { ...commonContent, ...model }
}

function getInputs (pageContent, commonContent, data, textPagination) {
  return {
    inputSearch: {
      id: 'searchTerm',
      name: 'searchTerm',
      classes: 'govuk-grid-column-one-half',
      inputmode: 'search',
      autocomplete: 'on',
      label: { text: pageContent.inputLabelSearch },
      ...(data.searchTerm ? { value: data.searchTerm } : {})
    },

    checkboxPermitType: {
      name: 'permitTypes',
      items: [
        {
          value: pt.IMPORT,
          text: commonContent.permitTypeDescriptionImport,
          checked: isChecked(data.permitTypes, pt.IMPORT)
        },
        {
          value: pt.EXPORT,
          text: commonContent.permitTypeDescriptionExport,
          checked: isChecked(data.permitTypes, pt.EXPORT)
        },
        {
          value: pt.REEXPORT,
          text: commonContent.permitTypeDescriptionReexport,
          checked: isChecked(data.permitTypes, pt.REEXPORT)
        },
        {
          value: pt.ARTICLE_10,
          text: commonContent.permitTypeDescriptionArticle10,
          checked: isChecked(data.permitTypes, pt.ARTICLE_10)
        }
      ]
    },
    checkboxStatus: {
      name: 'statuses',
      items: [
        {
          value: 'inProgress',
          text: commonContent.statusDescriptionInProgress,
          checked: isChecked(data.statuses, 'inProgress')
        },
        {
          value: 'awaitingPayment',
          text: commonContent.statusDescriptionAwaitingPayment,
          checked: isChecked(data.statuses, 'awaitingPayment')
        },
        {
          value: 'awaitingAdditionalPayment',
          text: commonContent.statusDescriptionAwaitingAdditionalPayment,
          checked: isChecked(data.statuses, 'awaitingAdditionalPayment')
        },
        {
          value: 'closed',
          text: commonContent.statusDescriptionClosed,
          checked: isChecked(data.statuses, 'closed')
        }
      ]
    },
    checkboxSubmittedBy: {
      name: 'submittedBy',
      items: [
        {
          value: 'me',
          text: pageContent.submittedByDescriptionMe,
          checked: isChecked(data.submittedBy, 'me')
        }
      ]
    },
    showCheckboxSubmittedBy: data.submittedByFilterEnabled,
    inputPagination: data.totalSubmissions > pageSize ? paginate(data.totalSubmissions, data.pageNo || 1, textPagination) : ''
  }
}

function getPageBodyContent (data, pageContent) {
  let pagebodyNoApplicationsFound = null
  let pageBodyNewApplicationFromPrevious = null
  if (data.noApplicationMadeBefore && data.submissions.length === 0) {
    pagebodyNoApplicationsFound = pageContent.pagebodyZeroApplication
  } else if ((data.noApplicationFound || data.noMatchingApplication) && data.submissions.length === 0) {
    pagebodyNoApplicationsFound = pageContent.pagebodyNoApplicationsFound
  } else {
    pageBodyNewApplicationFromPrevious = pageContent.pageBodyNewApplicationFromPrevious
  }
  return { pagebodyNoApplicationsFound, pageBodyNewApplicationFromPrevious }
}

function createAreYouSureModel (errors) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmissions.areYouSureDraftDelete
  const defaultTitle = pageContent.defaultTitle
  const pageHeader = pageContent.pageHeader
  const pageBody = `${pageContent.pageBody1}`
  const formActionPage = `${currentPath}/draft-delete`

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['areYouSure'])

  const model = {
    backLink: `${currentPath}`,
    formActionPage: formActionPage,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageHeader,
    pageBody: pageBody,
    continueWithoutSaveButton: true,
    inputName: 'areYouSure',
    inputClasses: 'govuk-radios--inline',
    errorMessage: getFieldError(errorList, '#areYouSure')
  }
  return { ...commonContent, ...model }
}

function getApplicationDate (date) {
  const dateObj = new Date(date)
  const options = { day: 'numeric', month: 'long', year: 'numeric' }
  const formattedDate = dateObj.toLocaleDateString('en-GB', options)
  return formattedDate
}

function paginate (totalSubmissions, currentPage, textPagination) {
  const totalPages = Math.ceil(totalSubmissions / pageSize)

  const prevAttr = currentPage === 1 ? { 'data-disabled': '' } : null
  const nextAttr = currentPage === totalPages ? { 'data-disabled': '' } : null

  const pagination = {
    id: 'pagination',
    name: 'pagination',
    previous: {
      href: currentPage === 1 ? '#' : `${currentPath}/${currentPage - 1}`,
      text: 'Previous',
      attributes: prevAttr
    },
    next: {
      href: currentPage === totalPages ? '#' : `${currentPath}/${currentPage + 1}`,
      text: 'Next',
      attributes: nextAttr
    },
    items: [{
      number: textPagination
    }]
  }

  return pagination
}

async function getSubmissionsData (request, pageNo, filterData) {
  let queryUrls = getYarValue(request, sessionKey.MY_SUBMISSIONS_QUERY_URLS)
  const { user: { organisationId } } = getYarValue(request, 'CIDMAuth')

  if (!queryUrls) {
    const searchTerm = filterData?.searchTerm ? filterData?.searchTerm.toUpperCase() : ''

    const submittedByFilterEnabled = user.hasOrganisationWideAccess(request)
    const queryUrl = await dynamics.getNewSubmissionsQueryUrl(request.auth.credentials.contactId, organisationId, filterData?.permitTypes, filterData?.statuses, filterData?.submittedBy, submittedByFilterEnabled, searchTerm)
    queryUrls = [queryUrl]
  }

  if (pageNo > queryUrls
    .length || pageNo < 1) {
    console.log('Invalid page number')
  }

  const { submissions, nextQueryUrl, totalSubmissions } = await dynamics.getSubmissions(request.server, queryUrls[pageNo - 1], pageSize)

  if (nextQueryUrl && queryUrls.length === pageNo) {
    queryUrls.push(nextQueryUrl)
  }

  setYarValue(request, sessionKey.MY_SUBMISSIONS_QUERY_URLS, queryUrls)

  return { submissions, totalSubmissions }
}

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/`,
    handler: (_request, h) => {
      return h.redirect(currentPath)
    }
  },
  // GET for my applications page
  {
    method: 'GET',
    path: `${currentPath}/{pageNo?}`,
    options: {
      validate: {
        params: Joi.object({
          pageNo: Joi.number().allow('')
        })
      }
    },

    handler: async (request, h) => {
      // const contactId = request.auth.credentials.contactId
      const pageNo = request.params.pageNo

      if (!pageNo) {
        setYarValue(request, sessionKey.MY_SUBMISSIONS_QUERY_URLS, null)
        setYarValue(request, sessionKey.MY_SUBMISSIONS_FILTER_DATA, null)
        return h.redirect(`${currentPath}/1`)
      }

      let filterData = getYarValue(request, sessionKey.MY_SUBMISSIONS_FILTER_DATA)

      if (!filterData) {
        filterData = { submittedBy: 'me' }
      }

      const { submissions, totalSubmissions } = await getSubmissionsData(request, pageNo, filterData)

      const cidmAuth = getYarValue(request, 'CIDMAuth')

      const draftSubmissionDetail = await getDraftSubmissionDetails(request)
      const submittedByFilterEnabled = user.hasOrganisationWideAccess(request)

      const pageData = {
        pageNo: pageNo,
        submissions: submissions,
        pageSize: pageSize,
        totalSubmissions: totalSubmissions,
        noApplicationMadeBefore: submissions.length === 0,
        permitTypes: filterData?.permitTypes,
        statuses: filterData?.statuses,
        searchTerm: filterData?.searchTerm,
        submittedBy: filterData?.submittedBy,
        organisationName: cidmAuth.user.organisationName,
        draftSubmissionDetail,
        submittedByFilterEnabled
      }
      return h.view(pageId, createModel(pageData))
    }
  },
  // POST for start new application button
  {
    method: 'POST',
    path: `${currentPath}/new-application`,
    options: {
      validate: {
        failAction: (_request, _h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const draftSubmissionDetail = await getDraftSubmissionDetails(request)
      if (draftSubmissionDetail.draftExists) {
        return h.redirect(draftSubmissionWarning)
      }
      clearChangeRoute(request)
      createSubmission(request)
      return h.redirect(`${nextPathPermitType}`)
    }
  },
  // POST for apply filter button and search button
  {
    method: 'POST',
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
          submittedBy: Joi.string().allow('')
        }),
        failAction: (_request, _h, error) => {
          console.log(error)
        }
      },
      handler: async (request, h) => {
        const pageNo = 1

        let filterPermitTypes = null

        if (request.payload.permitTypes) {
          if (Array.isArray(request.payload.permitTypes)) {
            filterPermitTypes = request.payload.permitTypes
          } else {
            filterPermitTypes = [request.payload.permitTypes]
          }
        }

        const filterData = {
          permitTypes: filterPermitTypes,
          statuses: request.payload.statuses,
          searchTerm: request.payload.searchTerm,
          submittedBy: request.payload.submittedBy
        }

        try {
          setYarValue(request, sessionKey.MY_SUBMISSIONS_QUERY_URLS, null)
          setYarValue(request, sessionKey.MY_SUBMISSIONS_FILTER_DATA, filterData)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const { submissions, totalSubmissions } = await getSubmissionsData(request, pageNo, filterData)
        const cidmAuth = getYarValue(request, 'CIDMAuth')
        const draftSubmissionDetail = await getDraftSubmissionDetails(request)
        const submittedByFilterEnabled = user.hasOrganisationWideAccess(request)

        const pageData = {
          pageNo: pageNo,
          submissions: submissions,
          pageSize: pageSize,
          totalSubmissions: totalSubmissions,
          permitTypes: filterData.permitTypes,
          statuses: filterData.statuses,
          searchTerm: filterData.searchTerm,
          submittedBy: filterData.submittedBy,
          noApplicationFound: submissions.length === 0,
          organisationName: cidmAuth.user.organisationName,
          draftSubmissionDetail,
          submittedByFilterEnabled
        }

        return h.view(pageId, createModel(pageData))
      }
    }
  },
  {
    method: 'GET',
    path: `${currentPath}/select/{submissionRef}`,
    options: {
      validate: {
        params: Joi.object({
          submissionRef: Joi.string().allow('')
        })
      }
    },

    handler: async (request, h) => {
      const submissionRef = request.params.submissionRef

      return h.redirect(`${nextPathMySubmission}/${submissionRef}`)
    }
  },
  {
    method: 'GET',
    path: `${currentPath}/draft-continue`,
    handler: async (request, h) => {
      const submission = await loadDraftSubmission(request)
      return h.redirect(submission.savePointUrl)
    }
  },
  {
    method: 'GET',
    path: `${currentPath}/draft-delete`,
    handler: async (_request, h) => {
      return h.view(areYouSureViewName, createAreYouSureModel(null))
    }
  },
  {
    method: 'POST',
    path: `${currentPath}/draft-delete`,
    options: {
      validate: {
        options: { abortEarly: false },
        payload: Joi.object({
          areYouSure: Joi.boolean().required()
        }),
        failAction: (_request, h, err) => {
          return h.view(areYouSureViewName, createAreYouSureModel(err)).takeover()
        }
      },
      handler: async (request, h) => {
        if (request.payload.areYouSure) {
          await deleteDraftSubmission(request)
        }
        return h.redirect(currentPath)
      }
    }
  }
]
