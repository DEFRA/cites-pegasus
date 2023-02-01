const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const { ADDRESS_REGEX } = require('../lib/regex-validation')
const { getAddressesByPostcode } = require('../services/address-service')
const textContent = require('../content/text-content')
const postcode = require('./postcode')
const pageId = 'select-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPostcode = `${urlPrefix}/postcode`
const contactTypes = ['agent', 'applicant', 'delivery']
const nextPath = `${urlPrefix}/confirm-address`
const invalidSubmissionPath = urlPrefix
const lodash = require('lodash')

function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    const selectAddressText = lodash.cloneDeep(textContent.selectAddress) //Need to clone the source of the text content so that the merge below doesn't affect other pages.

    if (data.contactType === 'applicant') {
        if (data.isAgent) {
            pageContent = lodash.merge(selectAddressText.common, selectAddressText.agentLed )
        } else {
            pageContent = lodash.merge(selectAddressText.common, selectAddressText.applicant )
        }
    } else if (data.contactType === 'agent') {
        pageContent = lodash.merge(selectAddressText.common, selectAddressText.agent )
    } else {
        pageContent = lodash.merge(selectAddressText.common, selectAddressText.delivery )
    }

    let errorList = null
    if (errors) {
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
        const fields = ['address']
        fields.forEach(field => {
            const fieldError = findErrorList(errors, [field], mergedErrorMessages)[0]
            if (fieldError) {
                errorList.push({
                    text: fieldError,
                    href: `#${field}`
                })
            }
        })
    }

    let addressSelectItems = []

    if (data.results && data.results.length > 0) {
        if (data.results.length === 1) {
            addressSelectItems.push({ value: "", text: pageContent.selectAddressPromptSingle })
        } else {
            addressSelectItems.push({ value: "", text: `${data.results.length} ${pageContent.selectAddressPromptMultiple}` })
        }

        data.results.forEach(res => { addressSelectItems.push({ value: res.Address.UPRN, text: res.Address.AddressLine, selected: res.Address.UPRN === data.uprn }) })
    } else {
        addressSelectItems.push({ value: "", text: pageContent.selectAddressPromptNoResults })
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
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
        selectAddress: {
            id: "address",
            name: "address",
            label: {
                text: pageContent.selectLabelAddress
            },
            items: addressSelectItems,
            classes: "govuk-!-width-two-thirds",
            errorMessage: getFieldError(errorList, '#address')
        },
    }
    return { ...commonContent, ...model }
}

function validateSearchData(searchData) {
    if (!searchData.postcode) {
        throw "must provide postcode or address search details"
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
            failAction: (request, h, error) => {
                console.log(error)
            }
        }
    },
    handler: async (request, h) => {
        const contactType = request.params.contactType
        const submission = getSubmission(request);
        try {
            const searchData = submission[contactType].addressSearchData
            validateSubmission(submission, `${pageId}/${contactType}`)
            validateSearchData(submission[contactType].addressSearchData)

            let newSubmission = {
                [contactType]: {
                    addressSearchData: {
                        results: null
                    }
                }
            }

            mergeSubmission(request, newSubmission, `${pageId}/${contactType}`)

            const response = await getAddressesByPostcode(searchData.postcode)
            const pageData = {
                contactType: contactType,
                permitType: submission?.permitType,
                isAgent: submission?.isAgent,
                ...submission[contactType]?.addressSearchData,
                results: response.results,
                ...submission[contactType].address,
            }

            newSubmission = {
                [contactType]: {
                    addressSearchData: {
                        results: response.results
                    }
                }
            }

            mergeSubmission(request, newSubmission, `${pageId}/${contactType}`)

            return h.view(pageId, createModel(null, pageData));
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidSubmissionPath}/`)
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
                address: Joi.string().required()
            }),
            failAction: (request, h, err) => {
                const submission = getSubmission(request);
                const pageData = {
                    contactType: request.params.contactType,
                    permitType: submission?.permitType,
                    isAgent: submission?.isAgent,
                    ...submission[request.params.contactType]?.addressSearchData,
                    ...request.payload
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const contactType = request.params.contactType
            try {
                const submission = getSubmission(request);

                const selectedAddress = submission[contactType].addressSearchData.results.find(x => x.Address.UPRN === request.payload.address).Address

                // const selectedAddress = {
                //     //SubBuildingName: "Room 1",
                //     BuildingName: "The building",
                //     BuildingNumber: "Building no 1",
                //     //Street: "The street",
                //     Locality: "locality",
                //     DependentLocality: "dep locality",
                //     Town: "town",
                //     County: "county",
                //     Postcode: "B74 4QJ",
                //     Country: "ENGLAND",
                //     UPRN: "100070591023"
                // }

                const addressLine1Components = [selectedAddress.SubBuildingName, selectedAddress.BuildingNumber, selectedAddress.BuildingName, selectedAddress.Street].filter(Boolean)
                const localityComponents = [selectedAddress.DependentLocality, selectedAddress.Locality].filter(Boolean)
                const otherAddressLineComponents = [localityComponents.join(", "), selectedAddress.Town, selectedAddress.County].filter(Boolean)

                const newSubmission = {
                    [contactType]: {
                        // addressSearchData: { //TODO COMMENT THIS BIT OUT
                        //     results: null
                        // },
                        address: {
                            //addressSummary: request.payload.address,
                            addressLine1: addressLine1Components.join(", ") || null,
                            addressLine2: otherAddressLineComponents[0] || null,
                            addressLine3: otherAddressLineComponents[1] || null,
                            addressLine4: otherAddressLineComponents[2] || null,
                            postcode: selectedAddress.Postcode || null,
                            country: selectedAddress.Country || null,
                            uprn: selectedAddress.UPRN || null
                        }
                    }
                }

                mergeSubmission(request, newSubmission, `${pageId}/${contactType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidSubmissionPath}/`)
            }

            return h.redirect(`${nextPath}/${contactType}`)
        }
    },
}
]