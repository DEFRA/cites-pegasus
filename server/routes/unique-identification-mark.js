const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getAppData, mergeAppData, validateAppData } = require('../lib/app-data')
const textContent = require('../content/text-content')
const nunjucks = require("nunjucks")
const pageId = 'unique-identification-mark'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/purpose-code`
const nextPath = `${urlPrefix}/specimen-type` //TO DO
const invalidAppDataPath = urlPrefix

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
    const fields = ["uniqueIdentificationMark"]
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
    { text: pageContent.radioOptionMicrochipNumber, value: 'microchipNumber' },
    { text: pageContent.radioOptionClosedRingNumber, value: 'closedRingNumber' },
    { text: pageContent.radioOptionSplitRingNumber , value: 'splitRingNumber' },
    { text: pageContent.radioOptionOtherRingNumber, value: 'otherRingNumber' },
    { text: pageContent.radioOptionCableTie, value: 'cableTie' },
    { text: pageContent.radioOptionHuntingTrophy, value: 'huntingTrophy' },
    { text: pageContent.radioOptionLabel, value: 'label' },
    { text: pageContent.radioOptionSwissInstitue, value: 'swissInstitute' },
    { text: pageContent.radioOptionSerialNumber, value: 'serialNumber' }
  ]

  const radioItems = radioOptions.map(x => x = getRadioItem(data.uniqueIdentificationMarkType, data.uniqueIdentificationMark, x))

  const model = {
    backLink: `${previousPath}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,


    inputUniqueIdentificationMark: {
      idPrefix: "uniqueIdentificationMark",
      name: "uniqueIdentificationMark",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: radioItems,
      errorMessage: getFieldError(errorList, "#uniqueIdentificationMark")
    }
  }
  return { ...commonContent, ...model }
}


function getRadioItem(uniqueIdentificationMarkType, uniqueIdentificationMark, radioOption) {

  const checked = uniqueIdentificationMarkType ? isChecked(uniqueIdentificationMarkType, radioOption.value) : false

  const html = getInputUniqueIdentificationMark(radioOption.value + 'Input', checked ? uniqueIdentificationMark : null)

  return {
    value: radioOption.value,
    text: radioOption.text,
    checked: checked,
    conditional: {
      html: html
    }
  }
}

function getInputUniqueIdentificationMark(inputId, uniqueIdentificationMark) {
  var renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n"
  renderString = renderString + " {{govukInput(input)}}"
  const inputModel = {
    input: {
      id: inputId,
      name: inputId,
      classes: "govuk-input govuk-input--width-2",
      label: { text: textContent.uniqueIdentificationMark.inputLabelUniqueIdentificationMark },
      ...(uniqueIdentificationMark ? { value: uniqueIdentificationMark } : {})//,
      //errorMessage: getFieldError(errorList, "#" + inputId)
    }
  }

  return nunjucks.renderString(renderString, inputModel)
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{speciesIndex}/{specimenIndex}`,
    options: {
      validate: {
        params: Joi.object({
          speciesIndex: Joi.number().required(),
          specimenIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const appData = getAppData(request)

      // try {
      //   validateAppData(
      //     appData,
      //     `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
      //   )
      // } catch (err) {
      //   console.log(err)
      //   return h.redirect(`${invalidAppDataPath}/`)
      // }

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        uniqueIdentificationMarkType: 'closedRingNumber',
        uniqueIdentificationMark: 'abcd1234'
          // appData.species[request.params.speciesIndex].specimens[
          //   request.params.specimenIndex
          // ].uniqueIdentificationMark
      }

      return h.view(pageId, createModel(null, pageData))
    }
  }//,
  // {
  //   method: "POST",
  //   path: `${currentPath}/{speciesIndex}/{specimenIndex}`,
  //   options: {
  //     validate: {
  //       params: Joi.object({
  //         speciesIndex: Joi.number().required(),
  //         specimenIndex: Joi.number().required()
  //       }),
  //       options: { abortEarly: false },
  //       payload: Joi.object({
  //         useCertificateFor: Joi.string().valid("legallyAcquired", "commercialActivities", "other", "moveALiveSpecimen").required()
  //       }),
  //       failAction: (request, h, err) => {
  //         const appData = getAppData(request)
  //         const pageData = {
  //           speciesIndex: request.params.speciesIndex,
  //           specimenIndex: request.params.specimenIndex,
  //           useCertificateFor:
  //             appData.species[request.params.speciesIndex].specimens[
  //               request.params.specimenIndex
  //             ]?.useCertificateFor
  //         }
  //         return h.view(pageId, createModel(err, pageData)).takeover()
  //       }
  //     },
  //     handler: async (request, h) => {
  //       const appData = getAppData(request)

  //       appData.species[request.params.speciesIndex].specimens[
  //         request.params.specimenIndex
  //       ].useCertificateFor = request.payload.useCertificateFor

  //       try {
  //         mergeAppData(
  //           request,
  //           { species: appData.species },
  //           `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
  //         )
  //       } catch (err) {
  //         console.log(err)
  //         return h.redirect(`${invalidAppDataPath}/`)
  //       }

  //       return h.redirect(
  //         `${nextPath}/${request.params.speciesIndex}/${request.params.specimenIndex}`
  //       )
  //     }
  //   }
  // }
]
