const Joi = require('joi')
const { urlPrefix, enableTagIdentifier } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { checkChangeRouteExit, setDataRemoved } = require("../lib/change-route")
const lodash = require('lodash')
const textContent = require('../content/text-content')
const nunjucks = require("nunjucks")
const pageId = 'unique-identification-mark'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathSpecimenType = `${urlPrefix}/specimen-type`
const previousPathTradeTermCode = `${urlPrefix}/trade-term-code`
const nextPathDescLivingAnimal = `${urlPrefix}/describe-living-animal`
const nextPathUnmarkedSpecimens = `${urlPrefix}/unmarked-specimens`
const nextPathDescGeneric = `${urlPrefix}/describe-specimen`

const invalidSubmissionPath = `${urlPrefix}/`

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
    const fields = ["uniqueIdentificationMarkType", "inputCB", "inputCR", "inputHU", "inputLB", "inputMC", "inputOT", "inputSN", "inputSR", "inputSI", "inputTG"]
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
    { text: pageContent.radioOptionCableTie, value: 'CB', hasInput: true },
    { text: pageContent.radioOptionHuntingTrophy, value: 'HU', hasInput: true },
    { text: pageContent.radioOptionLabel, value: 'LB', hasInput: true },
    { text: pageContent.radioOptionSwissInstitue, value: 'SI', hasInput: true },
    { text: pageContent.radioOptionSerialNumber, value: 'SN', hasInput: true },
    { text: pageContent.radioOptionDivider, value: null, hasInput: false },
    { text: pageContent.radioOptionUnmarked, value: 'unmarked', hasInput: false }
  ]

  if (enableTagIdentifier) {
    const insertIndex = radioOptions.length - 2
    radioOptions.splice(insertIndex, 0, { text: pageContent.radioOptionTag, value: 'TG', hasInput: true });
  }

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })
  const radioItems = radioOptions.map(x => x = getRadioItem(data.uniqueIdentificationMarkType, data.uniqueIdentificationMark, x, errorList))

  const previousPath = data.specimenType === 'animalLiving' ? previousPathSpecimenType : previousPathTradeTermCode

  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink
  
  const model = {
    backLink: backLink,
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
  const renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"
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
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        specimenType: species.specimenType,
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
          uniqueIdentificationMarkType: Joi.string().required().valid("MC", "CR", "SR", "OT", "CB", "HU", "LB", "SI", "SN", "TG", "unmarked"),
          inputCB: getUniqueIdentificationMarkInputSchema("CB"),
          inputCR: getUniqueIdentificationMarkInputSchema("CR"),
          inputHU: getUniqueIdentificationMarkInputSchema("HU"),
          inputLB: getUniqueIdentificationMarkInputSchema("LB"),
          inputMC: getUniqueIdentificationMarkInputSchema("MC"),
          inputOT: getUniqueIdentificationMarkInputSchema("OT"),
          inputSN: getUniqueIdentificationMarkInputSchema("SN"),
          inputTG: getUniqueIdentificationMarkInputSchema("TG"),
          inputSR: getUniqueIdentificationMarkInputSchema("SR"),
          inputSI: getUniqueIdentificationMarkInputSchema("SI"),
        }),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const species = submission.applications[applicationIndex].species

          const uniqueIdentificationMark = request.payload['input' + request.payload.uniqueIdentificationMarkType] || null
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: request.params.applicationIndex,
            specimenType: species.specimenType,
            uniqueIdentificationMark: uniqueIdentificationMark,
            uniqueIdentificationMarkType: request.payload.uniqueIdentificationMarkType
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        //const previousSubmission = getSubmission(request)
        // const newSubmission = lodash.cloneDeep(previousSubmission)
        // const previousSpecies = previousSubmission.applications[applicationIndex].species
        const species = submission.applications[applicationIndex].species

        const isMinorChange = species.kingdom === 'Plantae' || (species.uniqueIdentificationMarkType === 'unmarked') === (request.payload.uniqueIdentificationMarkType === 'unmarked')

        const uniqueIdentificationMark = request.payload['input' + request.payload.uniqueIdentificationMarkType]

        species.uniqueIdentificationMarkType = request.payload.uniqueIdentificationMarkType
        species.uniqueIdentificationMark = uniqueIdentificationMark || ""

        
        //Didn't change from unmarked to marked or vice versa
        if (!isMinorChange) {
          species.numberOfUnmarkedSpecimens = null
          species.specimenDescriptionLivingAnimal = null
          species.specimenDescriptionGeneric = null
          species.maleParentDetails = null
          species.femaleParentDetails = null
          species.sex = null
          species.dateOfBirth = null
        }

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.error(err)
          return h.redirect(invalidSubmissionPath)
        }

        if (!isMinorChange) {
          setDataRemoved(request)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false, isMinorChange)
        if (exitChangeRouteUrl) {
          saveDraftSubmission(request, exitChangeRouteUrl)
          return h.redirect(exitChangeRouteUrl)
        }

        let redirectTo = `${nextPathDescGeneric}/${applicationIndex}`
        if (species.specimenType === 'animalLiving') {
          if (request.payload.uniqueIdentificationMarkType === 'unmarked') {
            redirectTo = `${nextPathUnmarkedSpecimens}/${applicationIndex}`
          } else {
            redirectTo = `${nextPathDescLivingAnimal}/${applicationIndex}`
          }
        }
        
        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)

      }
    }
  }
]