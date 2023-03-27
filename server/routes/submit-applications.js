const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, cloneApplication} = require('../lib/submission')
const textContent = require('../content/text-content')
const pageId = 'submit-applications'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/application-summary/check/0`
const nextPathUploadSupportingDocuments = `${urlPrefix}/upload-supporting-documents`
const nextPathViewApplication = `${urlPrefix}/application-summary/view`//TO DO
const nextPathCopyApplication = `${urlPrefix}/application-summary/check`//TO DO
const nextPathAreYouSure = `${urlPrefix}/are-you-sure`
const lodash = require('lodash')
const invalidSubmissionPath = urlPrefix

function createSubmitApplicationModel(errors, data) {
  const commonContent = textContent.common
  
  let pageContent = null
  const submitApplicationsText = lodash.cloneDeep(textContent.submitApplications) //Need to clone the source of the text content so that the merge below doesn't affect other pages.

  switch (data.permitType) {
    case "import":
      pageContent = lodash.merge(submitApplicationsText.common, submitApplicationsText.importApplications)
      break
    case "export":
      pageContent = lodash.merge(submitApplicationsText.common, submitApplicationsText.importApplications) 
      break
    case "reexport":
      pageContent = lodash.merge(submitApplicationsText.common, submitApplicationsText.reexportApplications)
      break
    case "article10":
      pageContent = lodash.merge(submitApplicationsText.common, submitApplicationsText.article10Applications)
      break
  }

  const applicationsData = data.applications
  const applicationsTableData= applicationsData.map(application => {
    const speciesNameUrl = `${nextPathViewApplication}/${application.applicationIndex}`
    let unitsOfMeasurementText = null
    if (application.species.unitOfMeasurement && application.species.unitOfMeasurement === "noOfSpecimens") {
      unitsOfMeasurementText = pageContent.rowTextUnitsOfMeasurementNoOfSpecimens
    } else if (application.species.unitOfMeasurement && application.species.unitOfMeasurement === "noOfPiecesOrParts") {
      unitsOfMeasurementText = pageContent.rowTextUnitsOfMeasurementNoOfPiecesOrParts
    } else {
      unitsOfMeasurementText = application.species?.unitOfMeasurement
    }
    const formActionCopy = `${currentPath}/copy/${application.applicationIndex}`
    const formActionRemove = `${currentPath}/remove/are-you-sure/${application.applicationIndex}`
    return {speciesName: application.species.speciesName, speciesNameUrl, quantity: application.species.quantity, unitsOfMeasurementText, formActionCopy, formActionRemove}
  })

  const model = {
    backLink: previousPath,
    pageTitle: pageContent.defaultTitle,
    captionText: pageContent.pageHeader,
    tableHeadScientificName: pageContent.tableHeadScientificName,
    tableHeadQuantity: pageContent.tableHeadQuantity,
    tableHeadUnitOfMeasurement: pageContent.tableHeadUnitOfMeasurement,
    applicationsData : applicationsTableData,
    addAnotherSpeciesLinkText: pageContent.addAnotherSpeciesLinkText,
    addAnotherSpeciesUrl: `${urlPrefix}/species-name`,
    applyForADifferentTypeOfPermitLinkText: pageContent.applyForADifferentTypeOfPermitLinkText,
    applyForADifferentTypeOfPermitUrl: `${urlPrefix}/permit-type`, 
    isSubmitApplications: true,
    areYouSure: false
  }
  return { ...commonContent, ...model }
}

function createAreYouSureModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.submitApplications.areYouSureRemove
  const defaultTitle = `${pageContent.defaultTitlePart1} ${data.speciesName} ${pageContent.defaultTitlePart2}`

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
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
    formActionPage: `${currentPath}/remove/are-you-sure/{applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : defaultTitle,
    pageHeader: `${pageContent.pageHeaderPart1} ${data.speciesName} ${pageContent.pageHeaderPart2}`,
    areYouSure: true,
    isSubmitApplications:false,

    inputAreYouSure: {
      idPrefix: "areYouSure",
      name: "areYouSure",
      classes: "govuk-radios--inline",
      items: [
        {
          value: true,
          text: commonContent.radioOptionYes,
          checked: data.areYouSure
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
          checked: data.areYouSure === false
        }
      ],
      errorMessage: getFieldError(errorList, "#areYouSure")
    }
  }
  return { ...commonContent, ...model }
}


module.exports = [
  {
    method: "GET",
    path: currentPath,
    handler: async (request, h) => {
      const submission = getSubmission(request)
      const applications= submission.applications

      try {
        validateSubmission(submission, pageId)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const pageData = {
        permitType: submission.permitType,
        applications : applications
      }
      return h.view(pageId, createSubmitApplicationModel(null, pageData))
    }
  },
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
      const submission = getSubmission(request)
      const applications= submission.applications

      try {
        cloneApplication(request, applicationIndex)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }
      return h.redirect(`${nextPathCopyApplication}/${applications.length}`)
    }
  },
  {
    method: "POST",
    path: `${currentPath}`,
    options: {
      validate: {
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const pageData = {
            permitType: submission.permitType,
            applications : applications
          }
          return h.view(pageId, createSubmitApplicationModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        return h.redirect(nextPathUploadSupportingDocuments)
      }
    }
  },
  {
    method: "POST",
    path: `${currentPath}/remove/are-you-sure/{applicationIndex}`,
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
     
      try {
        validateSubmission(submission, pageId)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const pageData = {
        speciesName: submission.applications[applicationIndex].species.speciesName,
        areYouSure: submission.areYouSure,
      }
      return h.view(pageId, createAreYouSureModel(null, pageData))
    }
  },
  // {
  //   method: "POST",
  //   path: `${currentPath}/remove/are-you-sure/{applicationIndex}`,
  //   options: {
  //     validate: {
  //       params: Joi.object({
  //         applicationIndex: Joi.number().required(),
  //       }),
  //       failAction: (request, h, error) => {
  //         console.log(error)
  //       }
  //     }
  //   },
  //   handler: async (request, h) => {
  //     const { applicationIndex } = request.params
  //     const submission = getSubmission(request)
     
  //     try {
  //       validateSubmission(submission, pageId)
  //     } catch (err) {
  //       console.log(err)
  //       return h.redirect(`${invalidSubmissionPath}/`)
  //     }

  //     const pageData = {
  //       speciesName: submission.applications[applicationIndex].species.speciesName,
  //       areYouSure: submission.areYouSure,
  //     }
  //     return h.view(pageId, createAreYouSureModel(null, pageData))
  //   }
  // },
]

