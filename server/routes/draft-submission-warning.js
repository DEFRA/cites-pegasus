const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { createSubmission, deleteDraftSubmission, cloneSubmission, saveDraftSubmission } = require("../lib/submission")
const { clearChangeRoute } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'draft-submission-warning'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathLanding = `${urlPrefix}/`
const previousPathAppSummary = `${urlPrefix}/application-summary/view-submitted`
const nextPathPermitType = `${urlPrefix}/permit-type`
const nextPathCopyAsNewApplication = `${urlPrefix}/application-summary/copy-as-new`
const newSubmissionTypes = ['new', 'copy-as-new']

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.draftSubmissionWarning

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

  const backlink = getBacklink(data.newSubmissionType, data.applicationIndex)

  const model = {
    backLink: backlink,
    pageBody: pageContent.pageBody,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,

    inputAreYouSure: {
      idPrefix: "areYouSure",
      name: "areYouSure",
      classes: "govuk-radios--inline",
      items: [
        {
          value: true,
          text: commonContent.radioOptionYes,
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
        }
      ],
      errorMessage: getFieldError(errorList, "#areYouSure")
    }
  }

  return { ...commonContent, ...model }

}

function getBacklink(newSubmissionType, applicationIndex) {
  return newSubmissionType === 'copy-as-new' ? `${previousPathAppSummary}/${applicationIndex}` : previousPathLanding
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}/{newSubmissionType}/{applicationIndex?}`,
  options: {
    validate: {
      params: Joi.object({
        newSubmissionType: Joi.string().valid(...newSubmissionTypes).required(),
        applicationIndex: Joi.number().when('newSubmissionType', {
          is: 'copy-as-new',
          then: Joi.number().required(),
          otherwise: Joi.number().optional().allow(null, '')
        })
      })
    }
  },
  handler: async (request, h) => {

    const pageData = {
      newSubmissionType: request.params.newSubmissionType,
      applicationIndex: request.params.applicationIndex
    }

    return h.view('are-you-sure', createModel(null, pageData));
  }
},
{
  method: 'POST',
  path: `${currentPath}/{newSubmissionType}/{applicationIndex?}`,
  options: {
    validate: {
      params: Joi.object({
        newSubmissionType: Joi.string().valid(...newSubmissionTypes).required(),
        applicationIndex: Joi.number().when('newSubmissionType', {
          is: 'copy-as-new',
          then: Joi.number().required(),
          otherwise: Joi.number().optional().allow(null, '')
        })
      }),
      payload: Joi.object({
        areYouSure: Joi.boolean().required()
      }),
      failAction: (request, h, err) => {
        const pageData = {
          newSubmissionType: request.params.newSubmissionType,
          applicationIndex: request.params.applicationIndex
        }
        
        return h.view('are-you-sure', createModel(err, pageData)).takeover()        
      }
    }
  },
  handler: async (request, h) => {
    const { newSubmissionType, applicationIndex } = request.params

    if (request.payload.areYouSure) {
      if (newSubmissionType === 'copy-as-new') {
        cloneSubmission(request, applicationIndex)
        saveDraftSubmission(request, `${nextPathCopyAsNewApplication}/0`)
        return h.redirect(`${nextPathCopyAsNewApplication}/0`)
      } else {
        await deleteDraftSubmission(request)
        clearChangeRoute(request)
        createSubmission(request)
        return h.redirect(nextPathPermitType)
      }
    } else {
      const backlink = getBacklink(newSubmissionType, applicationIndex)
      return h.redirect(backlink)
    }
  }
}
]