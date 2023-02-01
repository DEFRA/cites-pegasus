const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getAppData, mergeAppData, validateAppData } = require("../lib/app-data")
const { ALPHA_REGEX } = require("../lib/regex-validation")
const textContent = require("../content/text-content")
const nunjucks = require("nunjucks")
const pageId = "trade-term-code"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathSpecimenType = `${urlPrefix}/specimen-type`
const previousPathCreatedDate = `${urlPrefix}/created-date`
const nextPath = `${urlPrefix}/unique-identification-mark`
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.tradeTermCode

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["isTradeTermCode", "tradeTermCode"]
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

  var renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const tradeTermCodeInput = nunjucks.renderString(renderString, {
    input: {
      id: "tradeTermCode",
      name: "tradeTermCode",
      classes: "govuk-input govuk-input--width-2",
      label: {
        text: pageContent.inputLabelTradeCode
      },
      hint: {
        text: pageContent.inputLabelTradeCodeHint
      },
      ...(data.tradeTermCode ? { value: data.tradeTermCode } : {}),
      errorMessage: getFieldError(errorList, "#tradeTermCode")
    }
  })

  const model = {
    backLink: data.createdDate ? `${previousPathCreatedDate}/${data.applicationIndex}` : `${previousPathSpecimenType}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: data.speciesName,

    inputIsTradeTermCode: {
      idPrefix: "isTradeTermCode",
      name: "isTradeTermCode",
      fieldset: {
        legend: {
          text: pageContent.pageHeader,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: true,
          text: commonContent.radioOptionYes,
          checked: data.isTradeTermCode,
          conditional: {
            html: tradeTermCodeInput
          }
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
          checked: data.isTradeTermCode === false
        }
      ],
      errorMessage: getFieldError(errorList, "#isTradeTermCode")
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
      const { applicationIndex } = request.params
      const appData = getAppData(request)
      
      try {
        validateAppData(appData, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidAppDataPath}/`)
      }
      
      const species = appData.applications[applicationIndex].species
      
      const pageData = {
        applicationIndex: applicationIndex,
        speciesName: species?.speciesName,
        isTradeTermCode: species.isTradeTermCode,
        tradeTermCode: species.tradeTermCode,
        createdDate: species.createdDate
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
          isTradeTermCode: Joi.boolean().required(),
          tradeTermCode: Joi.when("isTradeTermCode", {
            is: true,
            then: Joi.string().length(3).regex(ALPHA_REGEX).required()
          })
        }),

        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const appData = getAppData(request)
          const species = appData.applications[applicationIndex].species

          let isTradeTermCode = null
          switch (request.payload.isTradeTermCode) {
            case "true":
              isTradeTermCode = true
              break
            case "false":
              isTradeTermCode = false
              break
          }

          const pageData = {
            applicationIndex: applicationIndex,
            speciesName: species.speciesName,
            isTradeTermCode: isTradeTermCode,
            tradeTermCode: request.payload.tradeTermCode,
            createdDate: species.createdDate
          }

          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const appData = getAppData(request)
        const species = appData.applications[applicationIndex].species

        if (!request.payload.isTradeTermCode) {
          species.tradeTermCode = ""
        }

        species.isTradeTermCode = request.payload.isTradeTermCode
        species.tradeTermCode = request.payload.isTradeTermCode ? request.payload.tradeTermCode.toUpperCase() : ""

        try {
          mergeAppData(request, { applications: appData.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }

        return h.redirect(
          `${nextPath}/${applicationIndex}`
        )
      }
    }
  }
]
