const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getAppData, mergeAppData, validateAppData } = require('../lib/app-data')
const textContent = require('../content/text-content')
const nunjucks = require("nunjucks")
const pageId = 'describe-living-animal'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/unique-identification-mark`
const nextPathImporterExporter = `${urlPrefix}/importer-exporter`
const nextPathAcquiredDate = `${urlPrefix}/acquired-date`
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.describeLivingAnimal

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["sex", "undeterminedSexReason"]
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
    { text: pageContent.radioOptionSexMale, value: 'Female', hasInput: false },
    { text: pageContent.radioOptionSexFemale, value: 'Male', hasInput: false },
    { text: pageContent.radioOptionSexUndetermined, value: 'Undetermined', hasInput: true }
  ]

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })
  const radioItems = radioOptions.map(x => x = getRadioItem(data.sex, data.undeterminedSexReason, x, errorList))

  const model = {
    backLink: `${previousPath}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader + data.speciesName,
    speciesName: data.speciesName,
    inputLabelSex: pageContent.inputLabelSex,
    inputLabelDateOfBirth: pageContent.inputLabelDateOfBirth,
    inputLabelDescription: pageContent.inputLabelDescription,
    inputLabelParentDetails: pageContent.inputLabelParentDetails,
    showParentDetails: data.permitType === 'article10',
    inputSex: {
      idPrefix: "sex",
      name: "sex",
      items: radioItems,
      errorMessage: getFieldError(errorList, "#sex")
    },
    inputDateOfBirth: {
      id: "dateOfBirth",
      namePrefix: "dateOfBirth",
      hint: {
        text: "For example, 27 3 2007"
      }
    },
    inputDescription: {
      name: "description",
      id: "description",
      maxlength: 200,
      hint: {
        text: pageContent.inputHintDescription
      }
    }
  }
  return { ...commonContent, ...model }
}


function getRadioItem(sex, undeterminedSexReason, radioOption, errorList) {

  const checked = sex ? isChecked(sex, radioOption.value) : false

  const html = radioOption.hasInput ? getUndeterminedSexReason('input' + radioOption.value, checked ? undeterminedSexReason : null, errorList) : ""

  return {
    value: radioOption.value,
    text: radioOption.text,
    checked: checked,
    conditional: {
      html: html
    }
  }
}

function getUndeterminedSexReason(inputId, undeterminedSexReason, errorList) {
  var renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"
  const inputModel = {
    input: {
      id: inputId,
      name: inputId,
      classes: "govuk-input govuk-input--width-10",
      label: { text: textContent.describeLivingAnimal.inputLabelUndeterminedSexReason },
      ...(undeterminedSexReason ? { value: undeterminedSexReason } : {}),
      errorMessage: getFieldError(errorList, "#" + inputId)
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
        speciesName: appData.species[request.params.speciesIndex]?.speciesName,
        permitType: appData.permitType,
        sex: null,
        undeterminedSexReason: ""
//        appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex].sex
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{speciesIndex}/{specimenIndex}`,
    options: {
      validate: {
        params: Joi.object({
          speciesIndex: Joi.number().required(),
          specimenIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          sex: Joi.string().required().valid("Male", "Female", "Undetermined"),
          undeterminedSexReason: Joi.when('sex', {
            is: "Undetermined",
            then: Joi.string().required().min(3).max(50)
          })
        }),
        failAction: (request, h, err) => {
          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            speciesName: appData.species[request.params.speciesIndex]?.speciesName,
            permitType: appData.permitType,
            sex: request.payload.sex,
            undeterminedSexReason: request.payload.undeterminedSexReason
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        appData.species[request.params.speciesIndex].specimens[request.params.specimenIndex].specimenDescriptionLivingAnimal  = request.payload.description

        try {
          mergeAppData(
            request,
            { species: appData.species },
            `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }

        if(appData.permitType === 'article10'){
          return h.redirect(`${nextPathAcquiredDate}/${request.params.speciesIndex}/${request.params.specimenIndex}`)  
        } else {
          return h.redirect(`${nextPathImporterExporter}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
        }
        //TODO else 
        //        return h.redirect(`${nextPathGeneric}/${request.params.speciesIndex}/${request.params.specimenIndex}`
      }
    }
  }
]
