const Joi = require('joi')
const { urlPrefix, enableBreederPage } = require('../../config/config')
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { stringLength } = require('../lib/constants')
const { checkChangeRouteExit } = require('../lib/change-route')
const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const textContent = require('../content/text-content')
const { COMMENTS_REGEX } = require('../lib/regex-validation')
const pageId = 'describe-specimen'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathUniqueId = `${urlPrefix}/unique-identification-mark`
const previousPathHasUniqueMark = `${urlPrefix}/has-unique-identification-mark`
const previousPathMultipleSpecimens = `${urlPrefix}/multiple-specimens`
const nextPathOriginPermitDetails = `${urlPrefix}/origin-permit-details`
const nextPathImporterExporter = `${urlPrefix}/importer-exporter`
const nextPathAcquiredDate = `${urlPrefix}/acquired-date`
const nextPathBreeder = `${urlPrefix}/breeder`

const invalidSubmissionPath = `${urlPrefix}/`

function createModel (errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.specimenDescriptionGeneric
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['specimenDescriptionGeneric'])

  let previousPath = data.hasUniqueIdentificationMark ? previousPathUniqueId : previousPathHasUniqueMark
  if (data.specimenType === 'animalLiving' && data.isMultipleSpecimens && data.numberOfSpecimens > 1) {
    previousPath = previousPathMultipleSpecimens
  }

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    fullWidth: true,
    inputSpecimenDescriptionGeneric: {
      id: 'specimenDescriptionGeneric',
      name: 'specimenDescriptionGeneric',
      maxlength: stringLength.max500,
      classes: 'govuk-textarea govuk-js-character-count',
      label: {
        text: `${pageContent.pageHeader}`,
        isPageHeading: true,
        classes: 'govuk-label--l'
      },
      ...(data.specimenDescriptionGeneric ? { value: data.specimenDescriptionGeneric } : {}),
      errorMessage: getFieldError(errorList, '#specimenDescriptionGeneric')
    }
  }
  return { ...commonContent, ...model }
}

function failAction (request, h, err) {
  const { applicationIndex } = request.params
  const submission = getSubmission(request)
  const species = submission.applications[applicationIndex].species

  const pageData = {
    backLinkOverride: checkChangeRouteExit(request, true),
    applicationIndex: applicationIndex,
    speciesName: species.speciesName,
    isMultipleSpecimens: species.isMultipleSpecimens,
    numberOfSpecimens: species.numberOfUnmarkedSpecimens,
    specimenType: species.specimenType,
    hasUniqueIdentificationMark: species.hasUniqueIdentificationMark,
    ...request.payload
  }
  return h.view(pageId, createModel(err, pageData)).takeover()
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
        validateSubmission(submission, `${pageId}/${request.params.applicationIndex}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
        isMultipleSpecimens: species.isMultipleSpecimens,
        numberOfSpecimens: species.numberOfUnmarkedSpecimens,
        specimenType: species.specimenType,
        specimenDescriptionGeneric: species.specimenDescriptionGeneric,
        hasUniqueIdentificationMark: species.hasUniqueIdentificationMark
      }

      return h.view(pageId, createModel(null, pageData))
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
          specimenDescriptionGeneric: Joi.string().regex(COMMENTS_REGEX).required()
        }),
        failAction: failAction
      },

      handler: async (request, h) => {
        const { applicationIndex } = request.params

        const modifiedDescription = request.payload.specimenDescriptionGeneric.replace(/\r/g, '')
        const schema = Joi.object({ specimenDescriptionGeneric: Joi.string().min(stringLength.min5).max(stringLength.max500) })
        const result = schema.validate({ specimenDescriptionGeneric: modifiedDescription }, { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)
        }

        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        species.specimenDescriptionGeneric = modifiedDescription
        species.specimenDescriptionLivingAnimal = null
        species.sex = null
        species.maleParentDetails = null
        species.femaleParentDetails = null
        species.dateOfBirth = null

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

        let redirectTo
        if (submission.permitType === pt.REEXPORT && submission.otherPermitTypeOption === pto.SEMI_COMPLETE) {
          redirectTo = `${nextPathOriginPermitDetails}/${applicationIndex}`
        } else if (submission.permitType === pt.ARTICLE_10) {
          redirectTo = enableBreederPage && species.specimenType === 'animalLiving' ? `${nextPathBreeder}/${applicationIndex}` : `${nextPathAcquiredDate}/${applicationIndex}`
        } else {
          redirectTo = `${nextPathImporterExporter}/${applicationIndex}`
        }

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
