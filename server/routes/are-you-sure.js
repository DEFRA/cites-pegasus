const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { getChangeRouteData } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "are-you-sure"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/application-summary/check`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const changeType = data.changeRouteData.changeType
  const areYouSureText = textContent.areYouSure 
 
  let pageContent = null
  if (changeType === "permitType" ) {
    pageContent = areYouSureText.permitType
  } else if (changeType === "speciesName" ) {
    pageContent = areYouSureText.scientificName
  } else if (changeType === "deliveryAddress" ) {
    pageContent = areYouSureText.deliveryAddress
  } else if (changeType === "agentContactDetails") {
    pageContent = areYouSureText.yourContactDetails
  } else if (changeType === "agentAddress") {
    pageContent = areYouSureText.yourAddress
  } else if (!data.isAgent) {
    if(changeType === "applicantContactDetails") {
      pageContent = areYouSureText.yourContactDetails
    } else if (changeType === "applicantAddress"){
      pageContent = areYouSureText.yourAddress
    }
  } else if (data.isAgent) {
    if (changeType === "applicantContactDetails") {
      switch (data.permitType) {
        case "import":
          pageContent = areYouSureText.importerContactDetails
          break
        case "export":
          pageContent = areYouSureText.exporterContactDetails
          break
        case "reexport":
          pageContent = areYouSureText.reexporterContactDetails
          break
        case "article10":
          pageContent = areYouSureText.article10ContactDetails
          break
      }
    } else if (changeType === "applicantAddress") {
      switch (data.permitType) {
        case "import":
          pageContent = areYouSureText.importerAddress
          break
        case "export":
          pageContent = areYouSureText.exporterAddress
          break
        case "reexport":
          pageContent = areYouSureText.reexporterAddress
          break
        case "article10":
          pageContent = areYouSureText.article10Address
          break
      }
    }
  } 

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
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    pageBody: pageContent.pageBody2 ? `${pageContent.pageBody1} ${data.permitType} ${pageContent.pageBody2}` : pageContent.pageBody1,
    

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
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const { applicationIndex } = request.params
      const submission = getSubmission(request)
      const changeRouteData = getChangeRouteData(request)

      try {
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const pageData = {
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        isAgent: submission.isAgent,
        changeRouteData:changeRouteData,
        areYouSure: submission.areYouSure,

      }
      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          areYouSure: Joi.boolean().required()
        }),

        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const changeRouteData = getChangeRouteData(request)
        
          let areYouSure = null
          switch (request.payload.areYouSure) {
            case "true":
              areYouSure = true
              break
            case "false":
              areYouSure = false
              break
          }

          const pageData = {
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            isAgent: submission.isAgent,
            changeRouteData:changeRouteData,
            areYouSure: areYouSure,
           }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const changeRouteData = getChangeRouteData(request)

        if (request.payload.areYouSure) {
          return h.redirect(changeRouteData.startUrl)
        } else {
          return h.redirect(`${previousPath}/${applicationIndex}`)
        }
      }
    }
  }
]