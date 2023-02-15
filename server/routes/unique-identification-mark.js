const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const nunjucks = require("nunjucks")
const pageId = 'unique-identification-mark'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/trade-term-code`
const nextPathLivingAnimal = `${urlPrefix}/unmarked-specimens`
const nextPathGeneric = `${urlPrefix}/describe-specimen`

const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {


  const commonContent = textContent.common
  const pageContent = textContent.uniqueIdentificationMark

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["uniqueIdentificationMarkType", "inputCT", "inputCR", "inputHU", "inputLB", "inputMC", "inputOT", "inputSN", "inputSR", "inputSI"]
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

  let radioOptions = [
    { text: pageContent.radioOptionMicrochipNumber, value: 'MC', hasInput: true },
    { text: pageContent.radioOptionClosedRingNumber, value: 'CR', hasInput: true },
    { text: pageContent.radioOptionSplitRingNumber, value: 'SR', hasInput: true },
    { text: pageContent.radioOptionOtherRingNumber, value: 'OT', hasInput: true },
    { text: pageContent.radioOptionCableTie, value: 'CT', hasInput: true },
    { text: pageContent.radioOptionHuntingTrophy, value: 'HU', hasInput: true },
    { text: pageContent.radioOptionLabel, value: 'LB', hasInput: true },
    { text: pageContent.radioOptionSwissInstitue, value: 'SI', hasInput: true },
    { text: pageContent.radioOptionSerialNumber, value: 'SN', hasInput: true },
    { text: pageContent.radioOptionDivider, value: null, hasInput: false },
    { text: pageContent.radioOptionUnmarked, value: 'unmarked', hasInput: false }
  ]

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })
  const radioItems = radioOptions.map(x => x = getRadioItem(data.uniqueIdentificationMarkType, data.uniqueIdentificationMark, x, errorList))

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,

    inputUniqueIdentificationMark: {
      idPrefix: "uniqueIdentificationMarkType",
      name: "uniqueIdentificationMarkType",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: radioItems,
      errorMessage: getFieldError(errorList, "#uniqueIdentificationMarkType")
    }
  }
  return { ...commonContent, ...model }
}


function getRadioItem(uniqueIdentificationMarkType, uniqueIdentificationMark, radioOption, errorList) {

  if (!radioOption.value) {
    return {
      divider: radioOption.text
    }
  }

  const checked = uniqueIdentificationMarkType ? isChecked(uniqueIdentificationMarkType, radioOption.value) : false

  const html = radioOption.hasInput ? getInputUniqueIdentificationMark('input' + radioOption.value, checked ? uniqueIdentificationMark : null, errorList) : ""

  return {
    value: radioOption.value,
    text: radioOption.text,
    checked: checked,
    conditional: {
      html: html
    }
  }
}

function getInputUniqueIdentificationMark(inputId, uniqueIdentificationMark, errorList) {
  var renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"
  const inputModel = {
    input: {
      id: inputId,
      name: inputId,
      classes: "govuk-input govuk-input--width-10",
      label: { text: textContent.uniqueIdentificationMark.inputLabelUniqueIdentificationMark },
      ...(uniqueIdentificationMark ? { value: uniqueIdentificationMark } : {}),
      errorMessage: getFieldError(errorList, "#" + inputId)
    }
  }

  return nunjucks.renderString(renderString, inputModel)
}

const getUniqueIdentificationMarkInputSchema = (uniqueIdentificationMarkType) => {
  return Joi.when('uniqueIdentificationMarkType', {
    is: uniqueIdentificationMarkType,
    then: Joi.string().required().min(3).max(150)
  });
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
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        applicationIndex: applicationIndex,
        uniqueIdentificationMarkType: species.uniqueIdentificationMarkType,
        uniqueIdentificationMark: species.uniqueIdentificationMark
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
          uniqueIdentificationMarkType: Joi.string().required().valid("MC", "CR", "SR", "OT", "CT", "HU", "LB", "SI", "SN", "unmarked"),
          inputCT: getUniqueIdentificationMarkInputSchema("CT"),
          inputCR: getUniqueIdentificationMarkInputSchema("CR"),
          inputHU: getUniqueIdentificationMarkInputSchema("HU"),
          inputLB: getUniqueIdentificationMarkInputSchema("LB"),
          inputMC: getUniqueIdentificationMarkInputSchema("MC"),
          inputOT: getUniqueIdentificationMarkInputSchema("OT"),
          inputSN: getUniqueIdentificationMarkInputSchema("SN"),
          inputSR: getUniqueIdentificationMarkInputSchema("SR"),
          inputSI: getUniqueIdentificationMarkInputSchema("SI"),
        }),
        failAction: (request, h, err) => {
          var uniqueIdentificationMark = request.payload['input' + request.payload.uniqueIdentificationMarkType] || null
          const pageData = {
            applicationIndex: request.params.applicationIndex,
            uniqueIdentificationMark: uniqueIdentificationMark,
            uniqueIdentificationMarkType: request.payload.uniqueIdentificationMarkType
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        const uniqueIdentificationMark = request.payload['input' + request.payload.uniqueIdentificationMarkType]

        species.uniqueIdentificationMarkType = request.payload.uniqueIdentificationMarkType
        species.uniqueIdentificationMark = uniqueIdentificationMark || ""

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        if (species.specimenType === 'animalLiving') {
          return h.redirect(`${nextPathLivingAnimal}/${applicationIndex}`)
        } else {
          return h.redirect(`${nextPathGeneric}/${applicationIndex}`)
        }
      }
    }
  }
]
