const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const { NAME_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'unmarked-specimens'
const currentPath = `${urlPrefix}/${pageId}`
// const previousPathDescribeLivingAnimal = `${urlPrefix}/describe-living-animal`
// const previousPathDescribeSpecimen = `${urlPrefix}/describe-specimen`
// const nextPathPermitDetails = `${urlPrefix}/permit-details`
// const nextPathRemarks = `${urlPrefix}/remarks`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {

  const commonContent = textContent.common
  const pageContent = textContent.unmarkedSpecimens


  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["numberOfUnmarkedSpecimens"]
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

  //const previousPath = data.sex ? previousPathDescribeLivingAnimal: previousPathDescribeSpecimen

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    heading: pageContent.heading,
    headingAddress: pageContent.headingAddress,
    inputNumberOfUnmarkedSpecimens: {
      label: {
        text: pageContent.inputLabelCountry
      },
      id: "numberOfUnmarkedSpecimens",
      name: "numberOfUnmarkedSpecimens",
      classes: "govuk-!-width-two-thirds",
      ...(data.numberOfUnmarkedSpecimens ? { value: data.numberOfUnmarkedSpecimens } : {}),
      errorMessage: getFieldError(errorList, '#numberOfUnmarkedSpecimens')
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

      // try {
      //   validateSubmission(submission, `${pageId}/${request.params.applicationIndex}`)
      // } catch (err) {
      //   console.log(err)
      //   return h.redirect(`${invalidSubmissionPath}/`)
      // }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        applicationIndex: applicationIndex,
        numberOfUnmarkedSpecimens: species.numberOfUnmarkedSpecimens
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
          numberOfUnmarkedSpecimens: Joi.number().min(1).required()
        }),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const pageData = {
            applicationIndex: applicationIndex,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params

        submission.applications[applicationIndex].species.numberOfUnmarkedSpecimens = request.payload.numberOfUnmarkedSpecimens

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        if (submission.permitType === 'export') {
          return h.redirect(`${nextPathRemarks}/${applicationIndex}`)
        } else {
          return h.redirect(`${nextPathPermitDetails}/${applicationIndex}`)
        }
      }
    }
  }
]
