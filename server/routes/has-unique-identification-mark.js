const Joi = require('joi')
const { urlPrefix } = require('../../config/config')
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, setSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit } = require('../lib/change-route')
const textContent = require('../content/text-content')
const { permitType: pt } = require('../lib/permit-type-helper')
const pageId = 'has-unique-identification-mark'
const viewName = 'application-yes-no-layout'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathSpecimenType = `${urlPrefix}/specimen-type`
const previousPathTradeTermCode = `${urlPrefix}/trade-term-code`
const previousPathMultipleSpecimens = `${urlPrefix}/multiple-specimens`
const nextPathUniqueIdentificationMark = `${urlPrefix}/unique-identification-mark`
const nextPathDescLivingAnimal = `${urlPrefix}/describe-living-animal`
const nextPathDescGeneric = `${urlPrefix}/describe-specimen`

const invalidSubmissionPath = `${urlPrefix}/`

function createModel (errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.hasUniqueIdentificationMark

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['hasUniqueIdentificationMark'])

  let previousPath = previousPathTradeTermCode

  if (data.specimenType === 'animalLiving') {
    previousPath = previousPathMultipleSpecimens
    if (data.permitType === pt.ARTICLE_10) {
      previousPath = previousPathSpecimenType
    }
  }

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    inputName: 'hasUniqueIdentificationMark',
    pageHeader: pageContent.pageHeader,
    inputHint: pageContent.inputHint,
    inputYesChecked: data.hasUniqueIdentificationMark,
    errorMessage: getFieldError(errorList, '#hasUniqueIdentificationMark')
  }

  return { ...commonContent, ...model }
}

function failAction (request, h, err) {
  const { applicationIndex } = request.params
  const submission = getSubmission(request)
  const species = submission.applications[applicationIndex].species

  const pageData = {
    backLinkOverride: checkChangeRouteExit(request, true),
    applicationIndex: request.params.applicationIndex,
    specimenType: species.specimenType,
    hasUniqueIdentificationMark: request.payload.hasUniqueIdentificationMark,
    permitType: submission.permitType
  }
  return h.view(viewName, createModel(err, pageData)).takeover()
}

module.exports = [
  {
    method: 'GET',
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
        specimenType: species.specimenType,
        hasUniqueIdentificationMark: species.hasUniqueIdentificationMark,
        permitType: submission.permitType
      }

      return h.view(viewName, createModel(null, pageData))
    }
  },
  {
    method: 'POST',
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          hasUniqueIdentificationMark: Joi.boolean().required()
        }),
        failAction
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const hasUniqueIdentificationMark = request.payload.hasUniqueIdentificationMark
        const species = submission.applications[applicationIndex].species

        if (!hasUniqueIdentificationMark) {
          species.uniqueIdentificationMarks = null
        }
        species.hasUniqueIdentificationMark = hasUniqueIdentificationMark

        try {
          setSubmission(request, submission, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        let redirectTo = `${nextPathUniqueIdentificationMark}/${applicationIndex}`

        if (!hasUniqueIdentificationMark) {
          if (species.specimenType === 'animalLiving') {
            redirectTo = `${nextPathDescLivingAnimal}/${applicationIndex}`
          } else {
            redirectTo = `${nextPathDescGeneric}/${applicationIndex}`
          }
        }

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
