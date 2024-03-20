const Joi = require("joi")
const { urlPrefix } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require("../lib/submission")
const { ALPHA_REGEX } = require("../lib/regex-validation")
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "trade-term-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathQuantity = `${urlPrefix}/quantity`
const previousPathCreatedDate = `${urlPrefix}/created-date`
const nextPath = `${urlPrefix}/unique-identification-mark`
const invalidSubmissionPath = `${urlPrefix}/`
const unknownTradeTermCodeValue = 'UKN'

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.tradeTermCode

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["tradeTermCode"]
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

  const tradeTermCodes = []

  tradeTermCodes.push({
    text: pageContent.tradeTermCodeSelectDefault,
    value: '',
    selected: false
  })

  tradeTermCodes.push({
    text: pageContent.tradeTermCodeUnknown,
    value: unknownTradeTermCodeValue,
    selected: data.isTradeTermCode === false
  })  

  tradeTermCodes.push(...data.tradeTermCodes.map(tradeTermCode => {
    return {
      text: `${tradeTermCode.code} - ${tradeTermCode.name}`,
      value: tradeTermCode.code,
      selected: tradeTermCode.code === (data.tradeTermCode || '')
    }
  }))

  const selectTradeTermCode = {
    id: "tradeTermCode",
    name: "tradeTermCode",
    classes: "govuk-!-width-2",
    items: tradeTermCodes,
    errorMessage: getFieldError(errorList, '#tradeTermCode')
  }


  const defaultBacklink = data.createdDate ? `${previousPathCreatedDate}/${data.applicationIndex}` : `${previousPathQuantity}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContent.pageHeader,
    pageBody: pageContent.pageBody,
    pageBody2: pageContent.pageBody2,
    selectTradeTermCode    
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

      try {
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        speciesName: species?.speciesName,
        isTradeTermCode: species.isTradeTermCode,
        tradeTermCode: species.tradeTermCode,
        createdDate: species.createdDate,
        tradeTermCodes: request.server.app.tradeTermCodes
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
          tradeTermCode: Joi.string().length(3).regex(ALPHA_REGEX).required()
        }
        ),

        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const species = submission.applications[applicationIndex].species

          let isTradeTermCode = null
          if(request.payload.tradeTermCode){
            isTradeTermCode = request.payload.tradeTermCode !== unknownTradeTermCodeValue
          }

          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            speciesName: species.speciesName,
            isTradeTermCode, 
            tradeTermCode: request.payload.tradeTermCode,
            createdDate: species.createdDate,
            tradeTermCodes: request.server.app.tradeTermCodes
          }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species
        const selectedTradeTermCode = request.server.app.tradeTermCodes.find(tradeTermCode => tradeTermCode.code === request.payload.tradeTermCode)

        if (request.payload.tradeTermCode === unknownTradeTermCodeValue) {
          species.isTradeTermCode = false
          species.tradeTermCode = ""
          species.tradeTermCodeDesc = ""
        } else {               
          species.isTradeTermCode = true
          species.tradeTermCode = request.payload.tradeTermCode.toUpperCase()
          species.tradeTermCodeDesc = selectedTradeTermCode.name
        }

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        const redirectTo = `${nextPath}/${applicationIndex}`
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
        
      }
    }
  }
]
