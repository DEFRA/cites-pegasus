const Joi = require('joi')
const { urlPrefix } = require("../../config/config")
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, setSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const textContent = require('../content/text-content')
const nunjucks = require("nunjucks")
const pageId = 'multiple-specimens'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/specimen-type`
const nextPathUniqueIdentifier = `${urlPrefix}/has-unique-identification-mark`
const nextPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
const nextPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {

  const commonContent = textContent.common
  const pageContent = textContent.multipleSpecimens

  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ["isMultipleSpecimens", "numberOfSpecimens"])

  const renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const inputNumberOfSpecimens = nunjucks.renderString(renderString, {
    input: {
      id: "numberOfSpecimens",
      name: "numberOfSpecimens",
      classes: "govuk-input govuk-input--width-20",
      autocomplete: "on",
      label: {
        text: pageContent.inputLabelNumberOfSpecimens
      },
      // hint: {
      //   text: pageContent.inputLabelA10CertificateNumberHint
      // },
      ...(data.numberOfSpecimens ? { value: data.numberOfSpecimens } : {}),
      errorMessage: getFieldError(errorList, "#numberOfSpecimens")
    }
  })

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList && errorList?.length !== 0 ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    pageBody: pageContent.pageBody,


    isMultipleSpecimens: {
      idPrefix: "isMultipleSpecimens",
      name: "isMultipleSpecimens",
      fieldset: {
        legend: {
          text: pageContent.inputLabelIsMultipleSpecimens,
          isPageHeading: false,
          classes: "govuk-fieldset__legend--m"
        }
      },
      items: [
        {
          value: true,
          text: pageContent.radioOptionYes,
          checked: data.isMultipleSpecimens,
          conditional: {
            html: inputNumberOfSpecimens
          }
        },
        {
          value: false,
          text: pageContent.radioOptionNo,
          checked: data.isMultipleSpecimens === false
        }
      ],
      errorMessage: getFieldError(errorList, "#isA10CertificateNumberKnown")
    }
  }
  return { ...commonContent, ...model }
}

function validateNumberOfSpecimens(value, helpers) {

  if (value.length === 0) {
    return helpers.error('any.empty', { customLabel: 'numberOfSpecimens' })
  }

  const schema = Joi.number().min(2).max(1000000).integer()
  const result = schema.validate(value)

  if (result.error) {
    return helpers.error(result.error.details[0].type, { customLabel: 'numberOfSpecimens' })
  }

  return value
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
        validateSubmission(submission, `${pageId}/${request.params.applicationIndex}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        isMultipleSpecimens: species.isMultipleSpecimens,
        numberOfSpecimens: species.numberOfUnmarkedSpecimens
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
          isMultipleSpecimens: Joi.boolean().required(),
          numberOfSpecimens:Joi.number().when('isMultipleSpecimens', {
            is: true,
            then:  Joi.number().min(2).max(1000000).integer(),
            //then: Joi.any().custom(validateNumberOfSpecimens),
            otherwise: Joi.number().optional().allow(null, '')
          }) 
        }),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: applicationIndex,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species
        
        const isMajorChange = species.isMultipleSpecimens !== request.payload.isMultipleSpecimens

        species.isMultipleSpecimens = request.payload.isMultipleSpecimens
        species.numberOfUnmarkedSpecimens = request.payload.isMultipleSpecimens === true ? request.payload.numberOfSpecimens : null

        
        if (isMajorChange) {
          //If changing between 1 specimen and > 1 specimen, remove unique identifier and description details
          species.hasUniqueIdentificationMark = null
          species.uniqueIdentificationMarks = null
          species.specimenDescriptionGeneric = null
          species.specimenDescriptionLivingAnimal = null
          species.maleParentDetails = null
          species.femaleParentDetails = null
          species.sex = null
          species.dateOfBirth = null
        }

        try {
          setSubmission(request, submission, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        if (isMajorChange) {
          setDataRemoved(request)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false, !isMajorChange)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        let redirectTo = `${nextPathUniqueIdentifier}/${applicationIndex}`

        if (request.payload.isMultipleSpecimens && request.payload.numberOfSpecimens > 1) {
          redirectTo = `${nextPathDescribeSpecimen}/${applicationIndex}`
        }

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)
      }
    }
  }
]
