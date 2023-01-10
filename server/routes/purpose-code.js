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
const article10Path = `${urlPrefix}/use-certificate-for`
const nextPath = `${urlPrefix}/specimen-type` //TO DO
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
  const quantity = data.quantity
  const specimenIndex = data.specimenIndex + 1
  const unitOfMeasurement = data.unitOfMeasurement

  const captionText =
    unitOfMeasurement === "noOfSpecimens"
      ? `${speciesName} (${specimenIndex} of ${quantity})`
      : `${speciesName}`

  const model = {
    backLink: `${previousPath}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
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

      try {
        validateAppData(
          appData,
          `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
        )
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        speciesName: appData.species[request.params.speciesIndex]?.speciesName,
        quantity: appData.species[request.params.speciesIndex]?.quantity,
        unitOfMeasurement:
          appData.species[request.params.speciesIndex]?.unitOfMeasurement,
        purposeCode:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.purposeCode
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
          purposeCode: Joi.string().required()
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            speciesName:
              appData.species[request.params.speciesIndex]?.speciesName,
            quantity: appData.species[request.params.speciesIndex]?.quantity,
            unitOfMeasurement:
              appData.species[request.params.speciesIndex]?.unitOfMeasurement,
            purposeCode:
              appData.species[request.params.speciesIndex].specimens[
                request.params.specimenIndex
              ]?.purposeCode
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        appData.species[request.params.speciesIndex].specimens[
          request.params.specimenIndex
        ].purposeCode = request.payload.purposeCode

        try {
          mergeAppData(request, { species: appData.species }, `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`)
        } 
        catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }
    
        if (appData.permitType === "article10"){
          return h.redirect(
            `${article10Path}/${request.params.speciesIndex}/${request.params.specimenIndex}`
          )
        } else {
           return h.redirect(
          `${nextPath}/${request.params.speciesIndex}/${request.params.specimenIndex}`
        )
        }
      }
    }
  }
]
