const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { setChangeRoute, clearChangeRoute, getChangeRouteData, changeTypes } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "are-you-sure"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/application-summary/check`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
 
  let pageContent = null
  if (data.changeRouteData.changeType === "permitType" ) {
    pageContent = textContent.areYouSure.permitType
  } else if (data.changeRouteData.changeType === "speciesName" ) {
    pageContent = textContent.areYouSure.scientificName
  } else if (data.changeRouteData.changeType === "deliveryAddress" ) {
    pageContent = textContent.areYouSure.deliveryAddress
  } else if (data.changeRouteData.changeType === "agentContactDetails" ) {
    pageContent = textContent.areYouSure.yourContactDetails
  } else if (data.changeRouteData.changeType === "applicantContactDetails" && !data.isAgent) {
   pageContent = textContent.areYouSure.yourContactDetails
  } else if (data.changeRouteData.changeType === "applicantContactDetails" && data.isAgent) {
    if (data.permitType === "import") {
        pageContent = textContent.areYouSure.importerContactDetails
    } else if(data.permitType === "export") {
        pageContent = textContent.areYouSure.exporterContactDetails
    } else if(data.permitType === "reexport") {
        pageContent = textContent.areYouSure.reexporterContactDetails
    } else if(data.permitType === "article10") {
        pageContent = textContent.areYouSure.importerContactDetails
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
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
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

    //   try {
    //     validateSubmission(submission, `${pageId}/${applicationIndex}`)
    //   } catch (err) {
    //     console.log(err)
    //     return h.redirect(`${invalidSubmissionPath}/`)
    //   }

      const pageData = {
        applicationIndex: applicationIndex,
        changeRouteData:changeRouteData,
        areYouSure: submission.areYouSure
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
           areYouSure: areYouSure
           }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const changeRouteData = getChangeRouteData(request)
       
        submission.areYouSure = request.payload.areYouSure

        try {
          mergeSubmission(
            request,
            { applications: submission.applications },
            `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        if (request.payload.areYouSure) {
          return h.redirect(`${nextPathPermitDetails}/${applicationIndex}`)
        } else {
          return h.redirect(`${previousPath}/${applicationIndex}`)
        }
      }
    }
  }
]



// switch (data.changeRouteData.changeType) {
//     case "permitType" :
//       pageContent = textContent.areYouSure.permitType
//       break
//     case "speciesName":
//       pageContent = textContent.areYouSure.scientificName
//       break
//     case "agentContactDetails":
//     case "applicantContactDetails":
//       pageContent = textContent.areYouSure.yourContactDetails
//       break
//     case "deliveryAddress":
//       pageContent = textContent.areYouSure.deliveryAddress
//       break
//     case "applicantContactDetails":
//       pageContent = textContent.areYouSure.importerContactDetails
//       break
//     case "applicantContactDetails":
//       pageContent = textContent.areYouSure.exporterContactDetails
//       break
//     case "applicantContactDetails":
//       pageContent = textContent.areYouSure.reexporterContactDetails
//       break
//     case "applicantContactDetails":
//       pageContent = textContent.areYouSure.article10ContactDetails
//       break
//     }
  