const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const {
  getSubmission,
  mergeSubmission,
  validateSubmission
} = require("../lib/submission")
const textContent = require("../content/text-content")
const lodash = require("lodash")
const pageId = "quantity"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/specimen-type`
const nextPath = `${urlPrefix}//trade-term-code`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.quantity

  const unitsOfMeasurement = lodash.cloneDeep([
    { text: pageContent.unitOfMeasurementPrompt, value: null },
    ...pageContent.unitsOfMeasurement
  ])
  unitsOfMeasurement.forEach((e) => {
    if (e.value === data.unitOfMeasurement) e.selected = "true"
  })

  //   const previousPath =
  //     data.deliveryAddressOption === "different"
  //       ? `${urlPrefix}/confirm-address/delivery`
  //       : `${urlPrefix}/select-delivery-address`

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["quantity", "unitOfMeasurement"]
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
    backLink: `${previousPath}/${data.applicationIndex}`,
    pageHeader: pageContent.pageHeader,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    captionText: data.speciesName,

    inputQuantity: {
      label: {
        text: pageContent.inputLabelQuantity
      },
      id: "quantity",
      name: "quantity",
      classes: "govuk-input--width-4",
      ...(data.quantity ? { value: data.quantity } : {}),
      errorMessage: getFieldError(errorList, "#quantity")
    },
    selectUnitOfMeasurement: {
      label: {
        text: pageContent.selectLabelUnitOfMeasurement
      },
      id: "unitOfMeasurement",
      name: "unitOfMeasurement",
      items: unitsOfMeasurement,
      errorMessage: getFieldError(errorList, "#unitOfMeasurement")
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
      const submission = getSubmission(request)

      try {
        validateSubmission(submission, `${pageId}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const species = submission.applications[applicationIndex].species

      const pageData = {
        applicationIndex: applicationIndex,
        speciesName: species?.speciesName,
        quantity: species.quantity,
        unitOfMeasurement: species.unitOfMeasurement
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        options: { abortEarly: false },
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        payload: Joi.object({
          quantity: Joi.number().required().min(0.0001).max(1000000),
          unitOfMeasurement: Joi.string()
        }),
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const species = submission.applications[applicationIndex].species

          const pageData = {
            applicationIndex: applicationIndex,
            speciesName: species?.speciesName,
            quantity: request.payload.quantity,
            unitOfMeasurement: request.payload.unitOfMeasurement,
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },

      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)
        const species = submission.applications[applicationIndex].species

        species.quantity = request.payload.quantity
        species.unitOfMeasurement = request.payload.unitOfMeasurement

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`)
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        return h.redirect(
          `${nextPath}/${applicationIndex}`
        )




        // const speciesData = await getSpecies(
        //   request,
        //   request.payload.speciesName
        // )
        // const previousAppData = getAppData(request)
        // const newAppData = lodash.cloneDeep(previousAppData)
        // const newAppDataSpecies =
        //   newAppData.species[request.params.speciesIndex]
        // const previousAppDataSpecies =
        //   previousAppData?.species[request.params.speciesIndex]

        // newAppDataSpecies.speciesName = speciesData?.scientificname
        // newAppDataSpecies.speciesSearchData = request.payload.speciesName
        // newAppDataSpecies.quantity = request.payload.quantity
        // newAppDataSpecies.unitOfMeasurement = request.payload.unitOfMeasurement
        // newAppDataSpecies.kingdom = speciesData?.kingdom

        // if (
        //   previousAppDataSpecies.speciesName !== request.payload.speciesName
        // ) {
        //   //If changing speciesName , remove all specimens
        //   for (let i = 0; i < previousAppDataSpecies.quantity; i++) {
        //     newAppDataSpecies.specimens.pop()
        //   }
        // } else if (
        //   previousAppDataSpecies.unitOfMeasurement === "noOfSpecimens" &&
        //   request.payload.unitOfMeasurement !== "noOfSpecimens"
        // ) {
        //   //If switching from noOfSpecimens to a measurement, remove all specimens except one
        //   for (let i = 0; i < previousAppDataSpecies.quantity - 1; i++) {
        //     newAppDataSpecies.specimens.pop()
        //   }
        // } else if (
        //   previousAppDataSpecies.unitOfMeasurement === "noOfSpecimens" &&
        //   previousAppDataSpecies.quantity > request.payload.quantity
        // ) {
        //   //If reducing the noOfSpecimens, remove all surplus specimens until the number equals the quantity
        //   for (
        //     let i = 0;
        //     i < previousAppDataSpecies.quantity - request.payload.quantity;
        //     i++
        //   ) {
        //     newAppDataSpecies.specimens.pop()
        //   }
        // }

        // if (request.payload.unitOfMeasurement === "noOfSpecimens") {
        //   //Add new specimens to match the quantity
        //   for (let i = 0; i < request.payload.quantity; i++) {
        //     if (!newAppDataSpecies.specimens[i]) {
        //       newAppDataSpecies.specimens.push({ specimenIndex: i })
        //     }
        //   }
        // }

        // try {
        //   setAppData(request, newAppData)

        //   if (
        //     speciesData?.scientificname &&
        //     (speciesData.kingdom === "Animalia" ||
        //       speciesData.kingdom === "Plantae")
        //   ) {
        //     const nextPath = `${urlPrefix}/source-code/${request.params.speciesIndex}/0`
        //     return h.redirect(nextPath)
        //   }

        //   return h.redirect(
        //     `${unknownSpeciesPath}/${request.params.speciesIndex}`
        //   )
        // } catch (err) {
        //   console.log(err)
        //   return h.redirect(invalidAppDataPath)
        // }
      }
    }
  }
]
