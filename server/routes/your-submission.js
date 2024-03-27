const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { permitType: pt } = require('../lib/permit-type-helper')
const { getSubmission, setSubmission, createApplication, validateSubmission, cloneApplication, deleteApplication, getCompletedApplications, saveDraftSubmission, moveApplicationToEndOfList, reIndexApplications } = require('../lib/submission')
const { setYarValue } = require('../lib/session')
const textContent = require('../content/text-content')
const pageId = 'your-submission'
const currentPath = `${urlPrefix}/${pageId}`
const nextPathContinue = `${urlPrefix}/add-application`
const nextPathCheckApplication = `${urlPrefix}/application-summary/check`
const nextPathCopyApplication = `${urlPrefix}/application-summary/copy`
const nextPathSpeciesName = `${urlPrefix}/species-name`
const areYouSurePath = `are-you-sure`
const lodash = require('lodash')
const invalidSubmissionPath = `${urlPrefix}/`

function createSubmitApplicationModel(errors, data) {
  const commonContent = textContent.common

  let pageContent = null
  const yourSubmissionText = lodash.cloneDeep(textContent.yourSubmission) //Need to clone the source of the text content so that the merge below doesn't affect other pages.

  switch (data.permitType) {
    case pt.IMPORT:
      pageContent = lodash.merge(yourSubmissionText.common, yourSubmissionText.importApplications)
      break
    case pt.EXPORT:
      pageContent = lodash.merge(yourSubmissionText.common, yourSubmissionText.exportApplications)
      break
    case pt.MIC:
    case pt.TEC:
    case pt.POC:
    case pt.REEXPORT:
      pageContent = lodash.merge(yourSubmissionText.common, yourSubmissionText.reexportApplications)
      break
    case pt.ARTICLE_10:
      pageContent = lodash.merge(yourSubmissionText.common, yourSubmissionText.article10Applications)
      break
  }

  const applicationsData = data.applications
  const applicationsTableData = applicationsData.map(application => {
    const speciesNameUrl = `${nextPathCheckApplication}/${application.applicationIndex}`
    const internalReference = application.internalReference
    const uniqueIdentificationMark = application.species.uniqueIdentificationMark
    let unitsOfMeasurementText = null
    if (application.species.specimenType === "animalLiving") {
      if (application.species.numberOfUnmarkedSpecimens > 1) {
        unitsOfMeasurementText = `Specimen${application.species.numberOfUnmarkedSpecimens > 1 ? 's' : ''}`
      } else {
        unitsOfMeasurementText = `Specimen`
      }
    } else if (application.species.unitOfMeasurement === "noOfSpecimens") {
      unitsOfMeasurementText = pageContent.rowTextUnitsOfMeasurementNoOfSpecimens
    } else if (application.species.unitOfMeasurement === "noOfPiecesOrParts") {
      unitsOfMeasurementText = pageContent.rowTextUnitsOfMeasurementNoOfPiecesOrParts
    } else {
      unitsOfMeasurementText = application.species?.unitOfMeasurement
    }


    let quantity = application.species?.quantity
    if (application.species.specimenType === "animalLiving" && application.species.numberOfUnmarkedSpecimens) {
      quantity = application.species.numberOfUnmarkedSpecimens
    } else if (application.species.specimenType === "animalLiving") {
      quantity = 1
    }

    const formActionCopy = `${currentPath}/copy/${application.applicationIndex}`
    const formActionRemove = `${currentPath}/remove/${application.applicationIndex}`

    let labelUniqueIdentificationMark
    if (commonContent.uniqueIdentificationMarkTypes.hasOwnProperty(application.species.uniqueIdentificationMarkType)) {
      labelUniqueIdentificationMark = commonContent.uniqueIdentificationMarkTypes[application.species.uniqueIdentificationMarkType]
    }

    return { speciesName: application.species.speciesName, speciesNameUrl, quantity, unitsOfMeasurementText, labelUniqueIdentificationMark, uniqueIdentificationMark, internalReference, formActionCopy, formActionRemove }
  })


  const model = {
    pageTitle: pageContent.defaultTitle + commonContent.pageTitleSuffix,
    captionText: pageContent.pageHeader,
    tableHeadScientificName: pageContent.tableHeadScientificName,
    tableHeadQuantity: pageContent.tableHeadQuantity,
    tableHeadUnitOfMeasurement: pageContent.tableHeadUnitOfMeasurement,
    labelInternalReference: pageContent.labelInternalReference,
    applicationsData: applicationsTableData,
    addAnotherSpeciesUrl: `${currentPath}/create-application`,
    copyAriaLabel: pageContent.copyAriaLabel,
    removeAriaLabel: pageContent.removeAriaLabel,
    applyForADifferentTypeOfPermitUrl: `${currentPath}/${areYouSurePath}/permit-type`,
  }
  return { ...commonContent, ...model }
}

function createAreYouSureModel(errors, data) {
  const commonContent = textContent.common

  let pageContent = null
  let pageHeader = null
  let defaultTitle = null
  let formActionPage = null
  let pageBody = null
  let errorMessageRemove = null
  if (data.confirmType === 'remove') {
    pageContent = textContent.yourSubmission.areYouSureRemove
    defaultTitle = `${pageContent.defaultTitlePart1} ${data.speciesName} ${pageContent.defaultTitlePart2}`
    pageHeader = `${pageContent.pageHeaderPart1} ${data.speciesName} ${pageContent.pageHeaderPart2}`
    pageBody = data.applications.length === 1 ? pageContent.pageBody : ""
    formActionPage = `${currentPath}/${areYouSurePath}/remove/${data.applicationIndex}`
    errorMessageRemove = {
      'error.areYouSure.any.required': `${pageContent.errorMessages['error.areYouSure.part1.any.required']} ${data.speciesName} ${pageContent.errorMessages['error.areYouSure.part2.any.required']}`
    }
  } else {
    pageContent = textContent.yourSubmission.areYouSurePermitType
    defaultTitle = pageContent.defaultTitle
    pageHeader = pageContent.pageHeader
    pageBody = `${pageContent.pageBody1} ${data.permitType} ${pageContent.pageBody2}`
    formActionPage = `${currentPath}/${areYouSurePath}/permit-type`
  }

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages,
      ...errorMessageRemove
    }
    const fields = ["areYouSure"]
    fields.forEach((field) => {
      const fieldError = findErrorList(errors, [field], mergedErrorMessages)[0]
      if (fieldError) {
        errorList.push({
          text: fieldError,
          href: `#${field}`
        })
      }
    })
  }

  const model = {
    backLink: `${currentPath}`,
    formActionPage: formActionPage,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageHeader,
    pageBody: pageBody,

    inputAreYouSure: {
      idPrefix: "areYouSure",
      name: "areYouSure",
      classes: "govuk-radios--inline",
      items: [
        {
          value: true,
          text: commonContent.radioOptionYes
        },
        {
          value: false,
          text: commonContent.radioOptionNo
        }
      ],
      errorMessage: getFieldError(errorList, "#areYouSure")
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [
  //GET for submit applications page
  {
    method: "GET",
    path: currentPath,
    handler: async (request, h) => {
      const submission = getSubmission(request)
      let applicationStatuses = null

      try {
        applicationStatuses = validateSubmission(submission, pageId).applicationStatuses
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const completeApplications = getCompletedApplications(submission, applicationStatuses)

      setYarValue(request, 'cloneSource', null)

      const pageData = {
        permitType: submission.permitType,
        applications: completeApplications
      }
      return h.view(pageId, createSubmitApplicationModel(null, pageData))
    }
  },
  //GET for are you page from apply for a different type of permit link
  {
    method: "GET",
    path: `${currentPath}/${areYouSurePath}/permit-type`,
    handler: async (request, h) => {
      const submission = getSubmission(request)
      try {
        validateSubmission(submission, `${pageId}/${areYouSurePath}/permit-type`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }
      const pageData = {
        changeType: 'permit-type',
        permitType: submission.permitType
      }
      return h.view(areYouSurePath, createAreYouSureModel(null, pageData))
    }
  },
  //GET for Add another species link
  {
    method: "GET",
    path: `${currentPath}/create-application`,
    handler: async (request, h) => {
      const submission = getSubmission(request)
      let applicationStatuses = null
      try {
        applicationStatuses = validateSubmission(submission, `${pageId}/create-application`).applicationStatuses
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const inProgressAppStatus = applicationStatuses.find(appStatus => appStatus.status === 'in-progress')
      if (inProgressAppStatus) {
        let inProgressApplicationIndex = inProgressAppStatus.applicationIndex
        if (inProgressAppStatus.applicationIndex < submission.applications.length - 1) {
          //The application being worked on should always be the last in the array so that the add-application screen knows which was your last application so that it can offer you the chance to copy it
          moveApplicationToEndOfList(submission.applications, inProgressAppStatus.applicationIndex)
          reIndexApplications(submission.applications)
          setSubmission(request, submission)
          inProgressApplicationIndex = submission.applications.length - 1
        }
        return h.redirect(`${nextPathSpeciesName}/${inProgressApplicationIndex}`)
      }

      const applicationIndex = createApplication(request)
      return h.redirect(`${nextPathSpeciesName}/${applicationIndex}`)
    }
  },
  //GET for are you page from remove button
  {
    method: "GET",
    path: `${currentPath}/${areYouSurePath}/remove/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required(),
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { applicationIndex } = request.params
      const submission = getSubmission(request)
      const applications = submission.applications

      try {
        validateSubmission(submission, `${pageId}/${areYouSurePath}/remove`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }
      const pageData = {
        applicationIndex: applicationIndex,
        confirmType: "remove",
        applications: applications,
        speciesName: submission.applications[applicationIndex].species.speciesName,
        areYouSure: submission.areYouSure,
      }
      return h.view(areYouSurePath, createAreYouSureModel(null, pageData))
    }
  },
  //POST for submit applications page
  {
    method: "POST",
    path: `${currentPath}`,
    options: {
      validate: {
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const { applicationStatuses } = validateSubmission(submission, null)
          const completeApplications = getCompleteApplications(submission, applicationStatuses)

          const pageData = {
            permitType: submission.permitType,
            applications: completeApplications
          }
          return h.view(pageId, createSubmitApplicationModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        return h.redirect(nextPathContinue)
      }
    }
  },
  //POST for COPY button
  {
    method: "POST",
    path: `${currentPath}/copy/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required(),
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { applicationIndex } = request.params
      let newApplicationIndex
      try {
        newApplicationIndex = cloneApplication(request, applicationIndex)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }
      return h.redirect(`${nextPathCopyApplication}/${newApplicationIndex}`)
    }
  },
  //POST for REMOVE button
  {
    method: "POST",
    path: `${currentPath}/remove/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required(),
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { applicationIndex } = request.params

      return h.redirect(`${currentPath}/${areYouSurePath}/remove/${applicationIndex}`)
    }
  },
  //POST for are you page from apply for a different type of permit link
  {
    method: "POST",
    path: `${currentPath}/${areYouSurePath}/permit-type`,
    options: {
      validate: {
        options: { abortEarly: false },
        payload: Joi.object({
          areYouSure: Joi.boolean().required()
        }),
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const pageData = {
            confirmType: 'permit-type',
            permitType: submission.permitType,
          }
          return h.view(areYouSurePath, createAreYouSureModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        if (request.payload.areYouSure) {
          return h.redirect(`${urlPrefix}/permit-type`)
        } else {
          return h.redirect(`${currentPath}`)
        }
      }
    }
  },
  //POST for are you page from remove button
  {
    method: "POST",
    path: `${currentPath}/${areYouSurePath}/remove/{applicationIndex}`,
    options: {
      validate: {
        options: { abortEarly: false },
        params: Joi.object({
          applicationIndex: Joi.number().required(),
        }),
        payload: Joi.object({
          areYouSure: Joi.boolean().required()
        }),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const applications = submission.applications

          const pageData = {
            applicationIndex: applicationIndex,
            confirmType: "remove",
            applications: applications,
            speciesName: submission.applications[applicationIndex].species.speciesName,
          }
          return h.view(areYouSurePath, createAreYouSureModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const applicationIndex = request.params.applicationIndex;
        const submission = getSubmission(request)
        const applications = submission.applications

        if (request.payload.areYouSure) {
          try {
            deleteApplication(request, applicationIndex)
            saveDraftSubmission(request, currentPath)
          } catch (err) {
            console.error(err)
            return h.redirect(invalidSubmissionPath)
          }
          if (applications.length === 1) {
            return h.redirect(`${nextPathSpeciesName}/0`)
          }
        }
        return h.redirect(`${currentPath}`)
      }
    }
  }
]

