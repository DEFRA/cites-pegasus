const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, createApplication, validateSubmission, cloneApplication, deleteApplication, getCompletedApplications } = require('../lib/submission')
const { setYarValue } = require('../lib/session')
const textContent = require('../content/text-content')
const pageId = 'your-submission'
const currentPath = `${urlPrefix}/${pageId}`
const nextPathUploadSupportingDocuments = `${urlPrefix}/upload-supporting-documents`
const nextPathViewApplication = `${urlPrefix}/application-summary/view`
const nextPathCopyApplication = `${urlPrefix}/application-summary/copy`
const nextPathSpeciesName = `${urlPrefix}/species-name`
const areYouSurePath= `are-you-sure`
const lodash = require('lodash')
const invalidSubmissionPath = `${urlPrefix}/`

function createSubmitApplicationModel(errors, data) {
  const commonContent = textContent.common
  
  let pageContent = null
  const yourSubmissionText = lodash.cloneDeep(textContent.yourSubmission) //Need to clone the source of the text content so that the merge below doesn't affect other pages.

  switch (data.permitType) {
    case "import":
      pageContent = lodash.merge(yourSubmissionText.common, yourSubmissionText.importApplications)
      break
    case "export":
      pageContent = lodash.merge(yourSubmissionText.common, yourSubmissionText.exportApplications) 
      break
    case "reexport":
      pageContent = lodash.merge(yourSubmissionText.common, yourSubmissionText.reexportApplications)
      break
    case "article10":
      pageContent = lodash.merge(yourSubmissionText.common, yourSubmissionText.article10Applications)
      break
  }

  const applicationsData = data.applications
  const applicationsTableData= applicationsData.map(application => {
    const speciesNameUrl = `${nextPathViewApplication}/${application.applicationIndex}`
    let unitsOfMeasurementText = null
    if (application.species.specimenType === "animalLiving" && application.species.uniqueIdentificationMarkType === "unmarked") {
      unitsOfMeasurementText = `specimen${application.species.numberOfUnmarkedSpecimens > 1 ? 's' : ''}`
    } else if (application.species.specimenType === "animalLiving" && application.species.uniqueIdentificationMarkType !== "unmarked") {
      unitsOfMeasurementText =  `specimen`
    } else if (application.species.unitOfMeasurement && application.species.unitOfMeasurement === "noOfSpecimens") {
      unitsOfMeasurementText = pageContent.rowTextUnitsOfMeasurementNoOfSpecimens
    } else if (application.species.unitOfMeasurement && application.species.unitOfMeasurement === "noOfPiecesOrParts") {
      unitsOfMeasurementText = pageContent.rowTextUnitsOfMeasurementNoOfPiecesOrParts
    } else {
      unitsOfMeasurementText = application.species?.unitOfMeasurement
    }

    let quantity = null
    if (application.species.specimenType === "animalLiving" && application.species.uniqueIdentificationMarkType === "unmarked") {
      quantity = application.species.numberOfUnmarkedSpecimens
    } else if (application.species.specimenType === "animalLiving") {
      quantity = 1
    } else {
      quantity = application.species?.quantity
    }
    const formActionCopy = `${currentPath}/copy/${application.applicationIndex}`
    const formActionRemove = `${currentPath}/remove/${application.applicationIndex}`
    return {speciesName: application.species.speciesName, speciesNameUrl, quantity, unitsOfMeasurementText, formActionCopy, formActionRemove}
  })

  const model = {
    pageTitle: pageContent.defaultTitle,
    captionText: pageContent.pageHeader,
    tableHeadScientificName: pageContent.tableHeadScientificName,
    tableHeadQuantity: pageContent.tableHeadQuantity,
    tableHeadUnitOfMeasurement: pageContent.tableHeadUnitOfMeasurement,
    applicationsData : applicationsTableData,
    addAnotherSpeciesLinkText: pageContent.addAnotherSpeciesLinkText,
    addAnotherSpeciesUrl: `${currentPath}/create-application`,
    applyForADifferentTypeOfPermitLinkText: pageContent.applyForADifferentTypeOfPermitLinkText,
    applyForADifferentTypeOfPermitUrl: `${currentPath}/${areYouSurePath}/permit-type`,
  }
  return { ...commonContent, ...model }
}

function createAreYouSureModel(errors, data) {
  const commonContent = textContent.common
  
  let pageHeader = null
  let defaultTitle = null
  let formActionPage = null
  let pageBody = null
  let errorMessageRemove = null
  if(data.confirmType === 'remove') {
    pageContent = textContent.yourSubmission.areYouSureRemove,
    defaultTitle = `${pageContent.defaultTitlePart1} ${data.speciesName} ${pageContent.defaultTitlePart2}`
    pageHeader = `${pageContent.pageHeaderPart1} ${data.speciesName} ${pageContent.pageHeaderPart2}`
    pageBody = data.applications.length === 1 ? pageContent.pageBody : ""
    formActionPage= `${currentPath}/${areYouSurePath}/remove/${data.applicationIndex}`
    errorMessageRemove = {
      'error.areYouSure.any.required': `${pageContent.errorMessages['error.areYouSure.part1.any.required']} ${data.speciesName} ${pageContent.errorMessages['error.areYouSure.part2.any.required']}`
    } 
  } else {
    pageContent = textContent.yourSubmission.areYouSurePermitType,
    defaultTitle = pageContent.defaultTitle
    pageHeader =pageContent.pageHeader
    pageBody= `${pageContent.pageBody1} ${data.permitType} ${pageContent.pageBody2}`
    formActionPage= `${currentPath}/${areYouSurePath}/permit-type`
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
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : defaultTitle,
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
      let appStatuses = null

      try {
        appStatuses = validateSubmission(submission, pageId)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const completeApplications = getCompletedApplications(submission, appStatuses)
      
      setYarValue(request, 'cloneSource', null)

      const pageData = {
        permitType: submission.permitType,
        applications : completeApplications
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
      let appStatuses = null
      try {
        appStatuses = validateSubmission(submission, `${pageId}/create-application`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }      
      
      const inProgressAppStatus = appStatuses.find(appStatus => appStatus.status === 'in-progress')
      
      if(inProgressAppStatus) {
        return h.redirect(`${nextPathSpeciesName}/${inProgressAppStatus.applicationIndex}`)
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
          } catch (err) {
            console.error(err)
            return h.redirect(invalidSubmissionPath)
          }
          if (applications.length === 1 ) {
            return h.redirect(`${nextPathSpeciesName}/0`)
          }
        } 
        return h.redirect(`${currentPath}`)
      }
    }
  }
]

