const Joi = require('joi')
const { urlPrefix, enableDeliveryName } = require('../../config/config')
const { getErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, saveDraftSubmission } = require('../lib/submission')
const { ADDRESS_REGEX } = require('../lib/regex-validation')
const { getAddressesByPostcode } = require('../services/address-service')
const textContent = require('../content/text-content')
const { stringLength } = require('../lib/constants')
const pageId = 'select-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPostcode = `${urlPrefix}/postcode`
const contactTypes = ['agent', 'applicant', 'delivery']
const nextPath = `${urlPrefix}/confirm-address`
const invalidSubmissionPath = `${urlPrefix}/`
const lodash = require('lodash')

function createModel (errors, data) {
  const commonContent = textContent.common
  const selectAddressText = lodash.cloneDeep(textContent.selectAddress) // Need to clone the source of the text content so that the merge below doesn't affect other pages.

  const pageContent = getPageContent(data, selectAddressText)
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContent.errorMessages }, ['address', 'deliveryName'])

  const addressSelectItems = []

  if (data.results && data.results.length > 0) {
    if (data.results.length === 1) {
      addressSelectItems.push({ value: '', text: pageContent.selectAddressPromptSingle })
    } else {
      addressSelectItems.push({ value: '', text: `${data.results.length} ${pageContent.selectAddressPromptMultiple}` })
    }

    data.results.forEach(res => { addressSelectItems.push({ value: res.Address.UPRN, text: res.Address.AddressLine, selected: res.Address.UPRN === data.uprn }) })
  } else {
    addressSelectItems.push({ value: '', text: pageContent.selectAddressPromptNoResults })
  }

  const selectAddress = {
    id: 'address',
    name: 'address',
    label: {
      text: pageContent.selectLabelAddress
    },
    items: addressSelectItems,
    classes: 'govuk-!-width-two-thirds',
    errorMessage: getFieldError(errorList, '#address')
  }

  const inputDeliveryName = {
    id: 'deliveryName',
    name: 'deliveryName',
    label: {
      text: pageContent.inputLabelDeliveryName,
      classes: 'govuk-label--s',
      isPageHeading: false
    },
    hint: {
      text: pageContent.inputHintDeliveryName
    },
    ...(data.deliveryName ? { value: data.deliveryName } : {})
  }

  // const unitsOfMeasurement = lodash.cloneDeep([{ text: pageContent.unitOfMeasurementPrompt, value: null}, ...pageContent.unitsOfMeasurement])
  // unitsOfMeasurement.forEach(e => { if (e.value === data.unitOfMeasurement) e.selected = 'true' })

  const model = {
    backLink: `${previousPathPostcode}/${data.contactType}`,
    pageHeader: pageContent.pageHeader,
    formActionPage: `${currentPath}/${data.contactType}`,
    changePostcodeLinkText: pageContent.changePostcodeLinkText,
    changePostcodeUrl: `${previousPathPostcode}/${data.contactType}`,
    enterManualAddressLinkText: pageContent.enterManualAddressLinkText,
    enterManualAddressUrl: `/enter-address/${data.contactType}`,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContent.defaultTitle + commonContent.pageTitleSuffix,
    selectAddress,
    inputDeliveryName,
    showDeliveryName: data.contactType === 'delivery' && enableDeliveryName
  }
  return { ...commonContent, ...model }
}

function getPageContent (data, selectAddressText) {
  if (data.contactType === 'applicant') {
    if (data.isAgent) {
      return lodash.merge(selectAddressText.common, selectAddressText.agentLed)
    } else {
      return lodash.merge(selectAddressText.common, selectAddressText.applicant)
    }
  } else if (data.contactType === 'agent') {
    return lodash.merge(selectAddressText.common, selectAddressText.agent)
  } else {
    return lodash.merge(selectAddressText.common, selectAddressText.delivery)
  }
}

function validateSearchData (searchData) {
  if (!searchData.postcode) {
    throw new Error('must provide postcode or address search details')
  }
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}/{contactType}`,
  options: {
    validate: {
      params: Joi.object({
        contactType: Joi.string().valid(...contactTypes)
      }),
      failAction: (_request, _h, error) => {
        console.log(error)
      }
    }
  },
  handler: async (request, h) => {
    const contactType = request.params.contactType
    const submission = getSubmission(request)
    try {
      const searchData = submission[contactType].candidateAddressData.addressSearchData
      validateSubmission(submission, `${pageId}/${contactType}`)
      validateSearchData(submission[contactType].candidateAddressData.addressSearchData)

      let newSubmission = {
        [contactType]: {
          candidateAddressData: {
            addressSearchData: {
              results: null
            }
          }
        }
      }

      mergeSubmission(request, newSubmission, `${pageId}/${contactType}`)

      const response = await getAddressesByPostcode(searchData.postcode)
      const pageData = {
        contactType: contactType,
        permitType: submission?.permitType,
        isAgent: submission?.isAgent,
        ...submission[contactType]?.candidateAddressData.addressSearchData,
        results: response.results,
        ...submission[contactType].candidateAddressData.selectedAddress
      }

      newSubmission = {
        [contactType]: {
          candidateAddressData: {
            addressSearchData: {
              results: response.results
            }
          }
        }
      }

      mergeSubmission(request, newSubmission, `${pageId}/${contactType}`)

      return h.view(pageId, createModel(null, pageData))
    } catch (err) {
      console.error(err)
      return h.redirect(invalidSubmissionPath)
    }
  }
},
{
  method: 'POST',
  path: `${currentPath}/{contactType}`,
  options: {
    validate: {
      params: Joi.object({
        contactType: Joi.string().valid(...contactTypes)
      }),
      options: { abortEarly: false },
      payload: Joi.object({
        address: Joi.string().required(),
        deliveryName: Joi.string().max(stringLength.max150).regex(ADDRESS_REGEX).optional().allow('', null)
      }),
      failAction: (request, h, err) => {
        const submission = getSubmission(request)
        const pageData = {
          contactType: request.params.contactType,
          permitType: submission?.permitType,
          isAgent: submission?.isAgent,
          ...submission[request.params.contactType]?.candidateAddressData.addressSearchData,
          uprn: request.payload.address,
          deliveryName: request.payload.deliveryName
        }

        return h.view(pageId, createModel(err, pageData)).takeover()
      }
    },
    handler: async (request, h) => {
      const contactType = request.params.contactType
      try {
        const submission = getSubmission(request)

        const selectedAddress = submission[contactType].candidateAddressData.addressSearchData.results.find(x => x.Address.UPRN === request.payload.address).Address

        const addressLine1Components = [selectedAddress.SubBuildingName, selectedAddress.BuildingNumber, selectedAddress.BuildingName, selectedAddress.Street].filter(Boolean)
        const localityComponents = [selectedAddress.DependentLocality, selectedAddress.Locality].filter(Boolean)
        const otherAddressLineComponents = [localityComponents.join(', '), selectedAddress.Town, selectedAddress.County].filter(Boolean)

        const selectedCountry = request.server.app.countries.find(country => country.code === 'UK')

        const newSubmission = {
          [contactType]: {
            candidateAddressData: {
              selectedAddress: {
                addressLine1: addressLine1Components.join(', ') || null,
                addressLine2: otherAddressLineComponents[0] || null,
                addressLine3: otherAddressLineComponents[1] || null,
                addressLine4: otherAddressLineComponents[2] || null,
                postcode: selectedAddress.Postcode || null,
                country: selectedCountry.code || null,
                countryDesc: selectedCountry.name.toUpperCase() || null,
                uprn: selectedAddress.UPRN || null
              }
            }
          }
        }
        if (contactType === 'delivery') {
          newSubmission[contactType].addressOption = 'different'
          newSubmission[contactType].candidateAddressData.selectedAddress.deliveryName = request.payload.deliveryName?.trim()
        }

        mergeSubmission(request, newSubmission, `${pageId}/${contactType}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const redirectTo = `${nextPath}/${contactType}`
      saveDraftSubmission(request, redirectTo)
      return h.redirect(redirectTo)
    }
  }
}
]
