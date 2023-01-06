const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  findErrorList,
  getFieldError,
  isChecked
} = require("../lib/helper-functions")
const { getAppData, setAppData, validateAppData } = require("../lib/app-data")
const textContent = require("../content/text-content")
const pageId = "use-certificate-for"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/purpose-code`
const nextPath = `${urlPrefix}/specimen-details/` //TO DO
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.useCertificateFor

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["useCertificateFor"]
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
    backLink: `${previousPath}/${data.speciesIndex}/${data.specimenIndex}`,
    formActionPage: `${currentPath}/${data.speciesIndex}/${data.specimenIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: captionText,

    inputUseCertificateFor: {
      idPrefix: "useCertificateFor",
      name: "useCertificateFor",
      fieldset: {
        legend: {
          text: pageContent.heading,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "to prove that you legally acquired a specimen",
          text: pageContent.radioOptionOne,
          checked: isChecked(
            data.useCertificateFor,
            "to prove that you legally acquired a specimen"
          )
        },
        {
          value: "to use the specimen for commercial activities",
          text: pageContent.radioOptionTwo,
          checked: isChecked(
            data.useCertificateFor,
            "to use the specimen for commercial activities"
          )
        },
        {
          value:
            "to use the specimen for science, breeding, propagation, research, education or other non-detrimental purposes",
          text: pageContent.radioOptionThree,
          checked: isChecked(
            data.useCertificateFor,
            "to use the specimen for science, breeding, propagation, research, education or other non-detrimental purposes"
          )
        },
        {
          value: "to move a live specimen within Great Britain",
          text: pageContent.radioOptionFour,
          checked: isChecked(
            data.useCertificateFor,
            "to move a live specimen within Great Britain"
          )
        }
      ],
      errorMessage: getFieldError(errorList, "#useCertificateFor")
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

    //   try {
    //     validateAppData(
    //       appData,
    //       `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
    //     )
    //   } catch (err) {
    //     console.log(err)
    //     return h.redirect(`${invalidAppDataPath}/`)
    //   }

      const pageData = {
        speciesIndex: request.params.speciesIndex,
        specimenIndex: request.params.specimenIndex,
        useCertificateFor:
          appData.species[request.params.speciesIndex].specimens[
            request.params.specimenIndex
          ]?.useCertificateFor
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
          useCertificateFor: Joi.string().required()
        }),
        failAction: (request, h, err) => {
          const appData = getAppData(request)
          const pageData = {
            speciesIndex: request.params.speciesIndex,
            specimenIndex: request.params.specimenIndex,
            useCertificateFor:
              appData.species[request.params.speciesIndex].specimens[
                request.params.specimenIndex
              ]?.useCertificateFor
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const appData = getAppData(request)

        appData.species[request.params.speciesIndex].specimens[
          request.params.specimenIndex
        ].useCertificateFor = request.payload.useCertificateFor

        try {
          setAppData(
            request,
            { species: appData.species },
            `${pageId}/${request.params.speciesIndex}/${request.params.specimenIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidAppDataPath}/`)
        }

        return h.redirect(
          `${nextPath}/${request.params.speciesIndex}/${request.params.specimenIndex}`
        )
      }
    }
  }
]
