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

function createModel(errors, purposeCode) {
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
          classes:
            "govuk-body govuk-!-font-weight-bold govuk-!-margin-bottom-0",
          checked: isChecked(purposeCode, "B")
        },
        {
          value: "E",
          text: pageContent.radioOptionE,
          hint: { text: pageContent.radioOptionEHint },
          checked: isChecked(purposeCode, "E")
        },
        {
          value: "G",
          text: pageContent.radioOptionG,
          hint: { text: pageContent.radioOptionGHint },
          checked: isChecked(purposeCode, "G")
        },
        {
          value: "H",
          text: pageContent.radioOptionH,
          hint: { text: pageContent.radioOptionHHint },
          checked: isChecked(purposeCode, "H")
        },
        {
          value: "L",
          text: pageContent.radioOptionL,
          hint: { text: pageContent.radioOptionLHint },
          checked: isChecked(purposeCode, "L")
        },
        {
          value: "M",
          text: pageContent.radioOptionM,
          hint: { text: pageContent.radioOptionMHint },
          checked: isChecked(purposeCode, "M")
        },
        {
          value: "N",
          text: pageContent.radioOptionN,
          hint: { text: pageContent.radioOptionNHint },
          checked: isChecked(purposeCode, "N")
        },
        {
          value: "P",
          text: pageContent.radioOptionP,
          hint: { text: pageContent.radioOptionPHint },
          checked: isChecked(purposeCode, "P")
        },
        {
          value: "Q",
          text: pageContent.radioOptionQ,
          hint: { text: pageContent.radioOptionQHint },
          checked: isChecked(purposeCode, "Q")
        },
        {
          value: "S",
          text: pageContent.radioOptionS,
          hint: { text: pageContent.radioOptionSHint },
          checked: isChecked(purposeCode, "S")
        },
        {
          value: "T",
          text: pageContent.radioOptionT,
          hint: { text: pageContent.radioOptionTHint },
          checked: isChecked(purposeCode, "T")
        },
        {
          value: "Z",
          text: pageContent.radioOptionZ,
          hint: { text: pageContent.radioOptionZHint },
          checked: isChecked(purposeCode, "Z")
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
    handler: async (request, h) => {
      const appData = getAppData(request)
      // validateAppData(appData, pageId)
      return h.view(pageId, createModel(null, appData?.purposeCode))
    }
  },
  {
    method: "POST",
    path: currentPath,
    options: {
      validate: {
        options: { abortEarly: false },
        payload: Joi.object({
          purposeCode: Joi.string().required()
        }),
        failAction: (request, h, err) => {
          return h
            .view(pageId, createModel(err, request.payload.purposeCode))
            .takeover()
        }
      },
      handler: async (request, h) => {
        setAppData(request, {
          purposeCode: request.payload.species.purposeCode
        })

        return h.redirect(nextPath)
      }
    }
  }
]
