const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")

const textContent = require("../content/text-content")
const pageId = "purpose-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/source-code`
const nextPathArticle10 = `${urlPrefix}/use-certificate-for`
const nextPathSpecimenType = `${urlPrefix}/specimen-type` //TO DO
const invalidAppDataPath = urlPrefix

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

  const speciesName = data.speciesName
  const captionText = speciesName

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: captionText,

    inputPurposeCode: {
      idPrefix: "purposeCode",
      name: "purposeCode",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
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
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const appData = getAppData(request)

      try {
        validateAppData(
          appData,
          `${pageId}/${request.params.applicationIndex}`
        )
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const species = appData.applications[request.params.applicationIndex].species

      const pageData = {
        applicationIndex: request.params.applicationIndex,
        speciesName: species.speciesName,
        purposeCode: species.purposeCode
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
          purposeCode: Joi.string().valid("B", "E", "G", "H", "L", "M", "N", "P", "Q", "S", "T", "Z").required()
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const species = appData.applications[request.params.applicationIndex].species

          const pageData = {
            applicationIndex: request.params.applicationIndex,
            speciesName: species.speciesName,
            ...request.payload

          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const appData = getAppData(request)

        appData.applications[applicationIndex].species.purposeCode = request.payload.purposeCode

        try {
          mergeAppData(request, { applications: appData.applications }, `${pageId}/${applicationIndex}`)
        }
        catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }

        if (appData.permitType === "article10") {
          return h.redirect(
            `${nextPathArticle10}/${applicationIndex}`
          )
        } else {
          return h.redirect(
            `${nextPathSpecimenType}/${applicationIndex}`
          )
        }
      }
    }
  }
]
