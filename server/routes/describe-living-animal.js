const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const textContent = require('../content/text-content')
const { checkChangeRouteExit } = require("../lib/change-route")
const { isValidDate, isPastDate } = require("../lib/validators")
const nunjucks = require("nunjucks")
const pageId = 'describe-living-animal'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/unique-identification-mark`
const nextPathImporterExporter = `${urlPrefix}/importer-exporter`
const nextPathAcquiredDate = `${urlPrefix}/acquired-date`
const invalidSubmissionPath = urlPrefix

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
      "dateOfBirth-month",
      "dateOfBirth-year",
      "sex",
      "parentDetails",
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
      "dateOfBirth-month",
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
  const radioItems = radioOptions.map(x => x = getRadioItem(data.sex, x, errorList))

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
    inputLabelParentDetails: pageContent.inputLabelParentDetails,
    showParentDetails: data.permitType === 'article10',
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
    inputDateOfBirth: {
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
      items: getDateOfBirthInputGroupItems(dateOfBirthComponents, dateOfBirthErrors),
      errorMessage: dateOfBirthErrorMessage ? { html: dateOfBirthErrorMessage } : null
    },

    inputParentDetails: {
      name: "parentDetails",
      id: "parentDetails",
      maxlength: 250,
      hint: {
        text: pageContent.inputHintParentDetails
      },
      ...(data.parentDetails ? { value: data.parentDetails } : {}),
      errorMessage: getFieldError(errorList, "#parentDetails")
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

// function getUndeterminedSexReason(inputId, undeterminedSexReason, errorList) {
//   var renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"
//   const inputModel = {
//     input: {
//       id: inputId,
//       name: inputId,
//       classes: "govuk-input govuk-input--width-10",
//       label: { text: textContent.describeLivingAnimal.inputLabelUndeterminedSexReason },
//       ...(undeterminedSexReason ? { value: undeterminedSexReason } : {}),
//       errorMessage: getFieldError(errorList, "#" + inputId)
//     }
//   }

//   return nunjucks.renderString(renderString, inputModel)
// }

function dateOfBirthValidator(value, helpers) {
  const {
    "dateOfBirth-day": day,
    "dateOfBirth-month": month,
    "dateOfBirth-year": year
  } = value

  if (day || month || year) {
    if ((day && (!month || !year))
      || (month && !year)) {
      return helpers.error('any.invalid', { customLabel: 'dateOfBirth' });
    }

    const adjustedDay = !day ? 1 : day
    const adjustedMonth = !month && !day ? 1 : month
    
    if (!isValidDate(adjustedDay, adjustedMonth, year)) {
      return helpers.error('any.invalid', { customLabel: 'dateOfBirth' });
    } else {
      const date = new Date(year, adjustedMonth - 1, adjustedDay);
      if (!isPastDate(date, true)) {
        return helpers.error('any.future', { customLabel: 'dateOfBirth' });
      }
    }
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
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        backLinkOverride: checkChangeRouteExit(request, true),
        applicationIndex: applicationIndex,
        speciesName: species.speciesName,
        permitType: submission.permitType,
        parentDetails: species.parentDetails,
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
          parentDetails: Joi.string().min(3).max(250),
          description: Joi.string().max(500).optional().allow(null, ""),
          "dateOfBirth-day": Joi.number().optional().allow(null, ""),
          "dateOfBirth-month": Joi.number().optional().allow(null, ""),
          "dateOfBirth-year": Joi.number().optional().allow(null, ""),
          // undeterminedSexReason: Joi.when('sex', {
          //   is: "U",
          //   then: Joi.string().required().min(3).max(50)
          // })
        }).custom(dateOfBirthValidator),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const pageData = {
            backLinkOverride: checkChangeRouteExit(request, true),
            applicationIndex: request.params.applicationIndex,
            speciesName: submission.applications[applicationIndex].species.speciesName,
            permitType: submission.permitType,
            description: request.payload.description,
            parentDetails: request.payload.parentDetails,
            dateOfBirth: { day: request.payload["dateOfBirth-day"], month: request.payload["dateOfBirth-month"], year: request.payload["dateOfBirth-year"] },
            sex: request.payload.sex
            //undeterminedSexReason: request.payload.undeterminedSexReason
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        species.specimenDescriptionLivingAnimal = request.payload.description
        species.specimenDescriptionGeneric = null
        species.parentDetails = submission.permitType === 'article10' ? request.payload.parentDetails : null
        species.sex = request.payload.sex
        species.dateOfBirth = { day: parseInt(request.payload["dateOfBirth-day"]), month: parseInt(request.payload["dateOfBirth-month"]), year: parseInt(request.payload["dateOfBirth-year"]) }
        // species.undeterminedSexReason = request.payload.sex === 'U' ? request.payload.undeterminedSexReason : null

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        const exitChangeRouteUrl = checkChangeRouteExit(request, false)
        if (exitChangeRouteUrl) {
          return h.redirect(exitChangeRouteUrl)
        }
        
        if (submission.permitType === 'article10') {
          return h.redirect(`${nextPathAcquiredDate}/${applicationIndex}`)
        } else {
          return h.redirect(`${nextPathImporterExporter}/${applicationIndex}`)
        }
      }
    }
  }
]
