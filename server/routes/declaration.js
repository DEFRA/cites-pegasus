const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { ALPHA_REGEX } = require("../lib/regex-validation")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "declaration"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/upload-supporting-documents`
const nextPath = `${urlPrefix}/application-complete` //TO DO
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.declaration

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["declaration"]
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
    backLink: previousPath,
    formActionPage: currentPath,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    pageBody: data.isAgent ? pageContent.pageBodyAgent : pageContent.pageBodyApplicant,
    bulletListItems: data.isAgent ? pageContent.bulletListItems : "",
   

    inputDeclaration: {
      idPrefix: "declaration",
      name: "declaration",
      items: [
        {
          value: true,
          text: pageContent.checkboxLabelIAgree,
          checked: data.declaration,
        },
      ],
      errorMessage: getFieldError(errorList, "#declaration")
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
      try {
        validateSubmission(submission, pageId)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }
      const pageData = {
        isAgent: submission?.isAgent, 
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
          declaration: Joi.boolean().required(),
        }),
        failAction: (request, h, err) => {
          const submission = getSubmission(request)
          const pageData = {
            isAgent: submission?.isAgent,
            declaration: request.payload.declaration
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const submission = getSubmission(request)

        //TODO: ADD CALL TO DYNAMICS TO SUBMIT THE SUBMISSION

        // submission.declaration = request.payload.declaration
        // try {
        //   mergeSubmission(request, submission, pageId )
        // } catch (err) {
        //   console.log(err)
        //   return h.redirect(`${invalidSubmissionPath}/`)
        // }
        
        return h.redirect(nextPath)
      }
    }
  }
]
