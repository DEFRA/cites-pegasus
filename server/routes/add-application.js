const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, cloneApplication, getCompletedApplications } = require("../lib/submission")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "add-application"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/your-submission`
const nextPathContinue = `${urlPrefix}/upload-supporting-documents`
const nextPathAddSpecies = `${urlPrefix}/your-submission/create-application`
const nextPathCopyApplication = `${urlPrefix}/application-summary/copy`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.addApplication

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["addApplication"]
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

  const copyPrevious = pageContent.radioOptionCopyPrevious.replace('##SPECIES_NAME##', data.speciesName)

  const model = {
    backLink: previousPath,
    formActionPage: currentPath,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,

    inputAddApplication: {
      idPrefix: "addApplication",
      name: "addApplication",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "copyPrevious",
          text: copyPrevious,
          checked: isChecked(
            data.addApplication,
            "copyPrevious"
          )
        },
        {
          value: "addNew",
          text: pageContent.radioOptionAddNew,
          checked: isChecked(
            data.addApplication,
            "addNew"
          )
        },
        {
          value: "no",
          text: pageContent.radioOptionNo,
          checked: isChecked(
            data.addApplication,
            "no"
          )
        }
      ],
      errorMessage: getFieldError(errorList, "#addApplication")
    }
  }
  return { ...commonContent, ...model }
}

function copyPrevious(request, h) {
  const submission = getSubmission(request)
  const lastApplication = getLastCompletedApplication(submission)

  let newApplicationIndex
  try {
    newApplicationIndex = cloneApplication(request, lastApplication.applicationIndex)
  } catch (err) {
    console.error(err)
    return h.redirect(invalidSubmissionPath)
  }
  return h.redirect(`${nextPathCopyApplication}/${newApplicationIndex}`)
}

function getLastCompletedApplication(submission) {
    try {
    const { applicationStatuses } = validateSubmission(submission, pageId)
    
    const completeApplications = getCompletedApplications(submission, applicationStatuses)
    
    return completeApplications[completeApplications.length - 1]
  } catch (err) {
    console.error(err)
    throw err
  }
}

module.exports = [
  {
    method: "GET",
    path: currentPath,
    handler: async (request, h) => {
      const submission = getSubmission(request)

      const lastApplication = getLastCompletedApplication(submission)

      let addApplication = null

      if(request.headers.referer.endsWith(nextPathContinue)) {
        addApplication = 'no'
      }

      const pageData = {
        addApplication,
        speciesName: lastApplication.species.speciesName
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },

  {
    method: "POST",
    path: currentPath,
    options: {
      validate: {
        options: { abortEarly: false },
        payload: Joi.object({
          addApplication: Joi.string().valid("copyPrevious", "addNew", "no").required()
        }),
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const lastApplication = getLastCompletedApplication(submission)

          const pageData = {
            addApplication: null,
            speciesName: lastApplication.species.speciesName
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {

        switch (request.payload.addApplication) {
          case 'copyPrevious':
            return copyPrevious(request, h)
          case 'addNew':
            return h.redirect(nextPathAddSpecies)
          case 'no':
            return h.redirect(nextPathContinue)
          default:
            throw new Error("unknown add application value")
        }       
      }
    }
  }
]
