const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../helpers/helper-functions")
const {
  getAppData,
  setAppData,
  validateAppData
} = require("../helpers/app-data")

const textContent = require("../content/text-content")
const pageId = "purpose-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/source`
const nextPath = `${urlPrefix}/specimen-details`

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.purposeCode

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["purposeCode"]
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

  const model = {
    backLink: previousPath,
    formActionPage: currentPath,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    speciesName: "Homopus solus",
    quantity: "3",
    // speciesName: data.speciesName,
    // quantity: data.quantity,
    inputPurposeCode: {
      idPrefix: "purposeCode",
      name: "purposeCode",
      fieldset: {
        legend: {
          text: pageContent.heading,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "B",
          text: pageContent.radioOptionB,
          hint: { text: pageContent.radioOptionBHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "B")
        },
        {
          value: "E",
          text: pageContent.radioOptionE,
          hint: { text: pageContent.radioOptionEHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "E")
        },
        {
          value: "G",
          text: pageContent.radioOptionG,
          hint: { text: pageContent.radioOptionGHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "G")
        },
        {
          value: "H",
          text: pageContent.radioOptionH,
          hint: { text: pageContent.radioOptionHHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "H")
        },
        {
          value: "L",
          text: pageContent.radioOptionL,
          hint: { text: pageContent.radioOptionLHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "L")
        },
        {
          value: "M",
          text: pageContent.radioOptionM,
          hint: { text: pageContent.radioOptionMHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "M")
        },
        {
          value: "N",
          text: pageContent.radioOptionN,
          hint: { text: pageContent.radioOptionNHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "N")
        },
        {
          value: "P",
          text: pageContent.radioOptionP,
          hint: { text: pageContent.radioOptionPHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "P")
        },
        {
          value: "Q",
          text: pageContent.radioOptionQ,
          hint: { text: pageContent.radioOptionQHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "Q")
        },
        {
          value: "S",
          text: pageContent.radioOptionS,
          hint: { text: pageContent.radioOptionSHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "S")
        },
        {
          value: "T",
          text: pageContent.radioOptionT,
          hint: { text: pageContent.radioOptionTHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "T")
        },
        {
          value: "Z",
          text: pageContent.radioOptionZ,
          hint: { text: pageContent.radioOptionZHint },
          label: {
            classes: "govuk-!-font-weight-bold"
          },
          checked: isChecked(data.purposeCode, "Z")
        }
      ],
      errorMessage: getFieldError(errorList, "#purposeCode")
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [
  {
    method: "GET",
    path: currentPath,
    // path: `${currentPath}/{specimenId}`,
    handler: async (request, h) => {
      const appData = getAppData(request)
      // validateAppData(appData, pageId)

      const pageData = {
        // speciesId: request.params.speciesId,
        // specimenId: request.params.specimenId,
        speciesName: appData?.speciesName,
        unitOfMeasurement: appData?.unitOfMeasurement,
        quantity: appData?.quantity,
        purposeCode: appData?.purposeCode
        // ...appData[request.params.specimenId]
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },

  {
    method: "POST",
    path: currentPath,
    // path: `${currentPath}/{specimenId}`,
    options: {
      validate: {
        // params: Joi.object({
        //   specimenId: Joi.string().required()
        // }),
        options: { abortEarly: false },
        payload: Joi.object({
          purposeCode: Joi.string().required(),
          speciesName: Joi.string().required(),
          quantity: Joi.number().required().min(0.0001).max(1000000),
          unitOfMeasurement: Joi.string()
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            // speciesId: request.params.speciesId,
            // specimenId: request.params.specimenId,
            speciesName: appData?.speciesName,
            unitOfMeasurement: appData?.unitOfMeasurement,
            quantity: appData?.quantity,
            purposeCode: appData?.purposeCode
            // ...appData[request.params.specimenId]
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        setAppData(request, {
          purposeCode: request.payload.species.purposeCode
        })

        // return h.redirect((`${nextPath}/${request.params.specimenId}`))
        return h.redirect(nextPath)
      }
    }
  }
]

// appData?.purposeCode,
// appData?.speciesName,
// appData?.quantity,
// appData?.unitOfMeasurement,
// appData?.specimenId,
