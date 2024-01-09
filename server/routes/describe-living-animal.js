const Joi = require('joi')
const { urlPrefix, enableBreederPage } = require("../../config/config")
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const textContent = require('../content/text-content')
const { checkChangeRouteExit } = require("../lib/change-route")
const { dateValidator } = require("../lib/validators")
const { COMMENTS_REGEX } = require("../lib/regex-validation")
const pageId = 'describe-living-animal'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/unique-identification-mark`
const nextPathPermitDetails = `${urlPrefix}/permit-details`
const nextPathImporterExporter = `${urlPrefix}/importer-exporter`
const nextPathBreeder = `${urlPrefix}/breeder`
const nextPathAcquiredDate = `${urlPrefix}/acquired-date`
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.describeLivingAnimal

  let dateOfBirthErrors = []
  let errorList = null

  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = [
      "dateOfBirth",
      "dateOfBirth-day",
      "dateOfBirth-day-month",
      "dateOfBirth-day-year",
      "dateOfBirth-month",
      "dateOfBirth-month-year",
      "dateOfBirth-year",
      "sex",
      "maleParentDetails",
      "femaleParentDetails",
      "description"
    ]

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

  if (errorList) {
    const dateOfBirthFields = [
      "dateOfBirth",
      "dateOfBirth-day",
      "dateOfBirth-day-month",
      "dateOfBirth-day-year",
      "dateOfBirth-month",
      "dateOfBirth-month-year",
      "dateOfBirth-year"
    ]
    dateOfBirthFields.forEach((field) => {
      const error = getFieldError(errorList, "#" + field)
      if (error) {
        dateOfBirthErrors.push({ field: field, message: error.text })
      }
    })
  }

  const dateOfBirthErrorMessage = dateOfBirthErrors.map(item => { return item.message }).join('</p> <p class="govuk-error-message">')

  const dateOfBirthComponents = [
    { name: 'day', value: data.dateOfBirth.day },
    { name: 'month', value: data.dateOfBirth.month },
    { name: 'year', value: data.dateOfBirth.year }
  ]

  let radioOptions = [
    { text: pageContent.radioOptionSexMale, value: 'M', hasInput: false },
    { text: pageContent.radioOptionSexFemale, value: 'F', hasInput: false },
    { text: pageContent.radioOptionSexUndetermined, value: 'U', hasInput: false }
  ]

  //nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })
  const radioItems = radioOptions.map(x => getRadioItem(data.sex, x, errorList))

  const dateOfBirthInputGroupItems = getDateOfBirthInputGroupItems(dateOfBirthComponents, dateOfBirthErrors)

  const inputDateOfBirth = {
    id: "dateOfBirth",
    name: "dateOfBirth",
    namePrefix: "dateOfBirth",
    hint: {
      text: pageContent.inputHintDateOfBirth
    },
    // fieldset: {
    //   legend: {
    //     text: pageContent.pageHeader,
    //     isPageHeading: true,
    //     classes: "govuk-fieldset__legend--l"
    //   }
    // },
    items: dateOfBirthInputGroupItems,
    errorMessage: dateOfBirthErrorMessage ? { html: dateOfBirthErrorMessage } : null
  }
  
  const defaultBacklink = `${previousPath}/${data.applicationIndex}`
  const backLink = data.backLinkOverride ? data.backLinkOverride : defaultBacklink

  const model = {
    backLink: backLink,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    caption: data.speciesName,
    inputLabelSex: pageContent.inputLabelSex,
    inputLabelDateOfBirth: pageContent.inputLabelDateOfBirth,
    inputLabelDescription: pageContent.inputLabelDescription,
    inputLabelMaleParentDetails: pageContent.inputLabelMaleParentDetails,
    inputLabelFemaleParentDetails: pageContent.inputLabelFemaleParentDetails,
    showParentDetails: [pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(data.permitType),
    inputSex: {
      idPrefix: "sex",
      name: "sex",
      items: radioItems,
      errorMessage: getFieldError(errorList, "#sex")
    },
    // inputDateOfBirth: {
    //   id: "dateOfBirth",
    //   namePrefix: "dateOfBirth",
    //   hint: {
    //     text: pageContent.inputHintDateOfBirth
    //   }
    // },
    inputDateOfBirth: inputDateOfBirth,

    inputMaleParentDetails: {
      name: "maleParentDetails",
      id: "maleParentDetails",
      maxlength: 1000,
      hint: {
        text: pageContent.inputHintMaleParentDetails
      },
      ...(data.maleParentDetails ? { value: data.maleParentDetails } : {}),
      errorMessage: getFieldError(errorList, "#maleParentDetails")
    },
    inputFemaleParentDetails: {
      name: "femaleParentDetails",
      id: "femaleParentDetails",
      maxlength: 1000,
      hint: {
        text: pageContent.inputHintFemaleParentDetails
      },
      ...(data.femaleParentDetails ? { value: data.femaleParentDetails } : {}),
      errorMessage: getFieldError(errorList, "#femaleParentDetails")
    },
    inputDescription: {
      name: "description",
      id: "description",
      maxlength: 500,
      hint: {
        text: pageContent.inputHintDescription
      },
      ...(data.description ? { value: data.description } : {}),
      errorMessage: getFieldError(errorList, "#description")
    }
  }
  return { ...commonContent, ...model }
}


function getRadioItem(sex, radioOption, errorList) {

  const checked = sex ? isChecked(sex, radioOption.value) : false

  //const html = radioOption.hasInput ? getUndeterminedSexReason('undeterminedSexReason', checked ? undeterminedSexReason : null, errorList) : ""

  return {
    value: radioOption.value,
    text: radioOption.text,
    checked: checked
    // conditional: {
    //   html: html
    // }
  }
}

function getDateOfBirthInputGroupItems(components, dateOfBirthErrors) {

  return components.map(component => {
    let classes = component.name === 'year' ? 'govuk-input--width-4' : 'govuk-input--width-2'
    const inputError = dateOfBirthErrors.filter(item => item.field.includes('-' + component.name) || item.field === 'dateOfBirth')
    if (inputError.length) {
      classes += ' govuk-input--error'
    }
    return { name: component.name, classes: classes, value: component.value }
  })
}

function dateOfBirthValidator(value, helpers) {
  const {
    "dateOfBirth-day": day,
    "dateOfBirth-month": month,
    "dateOfBirth-year": year
  } = value

  if ((day + month + year).length === 0){
    return value
  }

  const dateValidatorResponse = dateValidator(day, month, year, false, 'dateOfBirth', helpers)
  if (dateValidatorResponse) {
    return dateValidatorResponse
  }

  return value
}

function failAction(request, h, err) {
  const { applicationIndex } = request.params
  const submission = getSubmission(request)
  const pageData = {
    backLinkOverride: checkChangeRouteExit(request, true),
    applicationIndex: request.params.applicationIndex,
    speciesName: submission.applications[applicationIndex].species.speciesName,
    permitType: submission.permitType,
    description: request.payload.description,
    maleParentDetails: request.payload.maleParentDetails,
    femaleParentDetails: request.payload.femaleParentDetails,
    dateOfBirth: { day: request.payload["dateOfBirth-day"], month: request.payload["dateOfBirth-month"], year: request.payload["dateOfBirth-year"] },
    sex: request.payload.sex
    //undeterminedSexReason: request.payload.undeterminedSexReason
  }
  return h.view(pageId, createModel(err, pageData)).takeover()
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
        speciesName: species.speciesName,
        permitType: submission.permitType,
        maleParentDetails: species.maleParentDetails,
        femaleParentDetails: species.femaleParentDetails,
        description: species.specimenDescriptionLivingAnimal,
        dateOfBirth: { day: species.dateOfBirth?.day, month: species.dateOfBirth?.month, year: species.dateOfBirth?.year },
        sex: species.sex
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
          sex: Joi.string().required().valid("M", "F", "U"),
          maleParentDetails: Joi.string().regex(COMMENTS_REGEX).optional().allow(null, ""),
          femaleParentDetails: Joi.string().regex(COMMENTS_REGEX).optional().allow(null, ""),
          description: Joi.string().regex(COMMENTS_REGEX).optional().allow(null, ""),
          "dateOfBirth-day": Joi.number().optional().allow(null, ""),
          "dateOfBirth-month": Joi.number().optional().allow(null, ""),
          "dateOfBirth-year": Joi.number().optional().allow(null, ""),
          // undeterminedSexReason: Joi.when('sex', {
          //   is: "U",
          //   then: Joi.string().required().min(3).max(50)
          // })
        }).custom(dateOfBirthValidator),
        failAction: failAction
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        const modifiedDescription = request.payload.description.replace(/\r/g, '')
        const modifiedMaleParentDetails = [pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(submission.permitType) ? request.payload.maleParentDetails.replace(/\r/g, '') : null
        const modifiedFemaleParentDetails = [pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(submission.permitType) ? request.payload.femaleParentDetails.replace(/\r/g, '') : null
        const schema = Joi.object({ 
          description: Joi.string().max(500).optional().allow(null, ""),
          maleParentDetails: Joi.string().min(3).max(1000).optional().allow(null, ""),
          femaleParentDetails: Joi.string().min(3).max(1000).optional().allow(null, "") })
        const result = schema.validate({description: modifiedDescription, maleParentDetails: modifiedMaleParentDetails, femaleParentDetails: modifiedFemaleParentDetails },  { abortEarly: false })

        if (result.error) {
          return failAction(request, h, result.error)
        }

        

        species.specimenDescriptionLivingAnimal = request.payload.description.replace(/\r/g, '')
        species.specimenDescriptionGeneric = null
        species.maleParentDetails = [pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(submission.permitType) ? request.payload.maleParentDetails.replace(/\r/g, '') : null
        species.femaleParentDetails = [pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(submission.permitType) ? request.payload.femaleParentDetails.replace(/\r/g, '') : null
        species.sex = request.payload.sex
        species.dateOfBirth = { day: parseInt(request.payload["dateOfBirth-day"]), month: parseInt(request.payload["dateOfBirth-month"]), year: parseInt(request.payload["dateOfBirth-year"]) }
        // species.undeterminedSexReason = request.payload.sex === 'U' ? request.payload.undeterminedSexReason : null

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`
          )
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
        if(submission.permitType === pt.REEXPORT && submission.otherPermitTypeOption === pto.SEMI_COMPLETE){
          redirectTo = `${nextPathPermitDetails}/${applicationIndex}`
        } else if (submission.permitType === pt.ARTICLE_10) {
          redirectTo = enableBreederPage ? `${nextPathBreeder}/${applicationIndex}` : `${nextPathAcquiredDate}/${applicationIndex}`
        } else {
          redirectTo = `${nextPathImporterExporter}/${applicationIndex}`
        }

        saveDraftSubmission(request, redirectTo)
        return h.redirect(redirectTo)

      }
    }
  }
]
