const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getAppData, mergeAppData, validateAppData } = require('../lib/app-data')
const { ADDRESS_REGEX } = require('../lib/regex-validation')
const { getAddressesByPostcode } = require('../services/address-service')
const textContent = require('../content/text-content')
const postcode = require('./postcode')
const pageId = 'select-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPostcode = `${urlPrefix}/postcode`
const contactTypes = ['agent', 'applicant', 'delivery']
const nextPath = `${urlPrefix}/confirm-address`
const invalidAppDataPath = urlPrefix
const lodash = require('lodash')

function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    if (data.contactType === 'applicant') {
        if (data.isAgent) {
            pageContent = lodash.merge(textContent.selectAddress.common, textContent.selectAddress.agentLed )
        } else {
            pageContent = lodash.merge(textContent.selectAddress.common, textContent.selectAddress.applicant )
        }
    } else if (data.contactType === 'agent') {
        pageContent = lodash.merge(textContent.selectAddress.common, textContent.selectAddress.agent )
    } else {
        pageContent = lodash.merge(textContent.selectAddress.common, textContent.selectAddress.delivery )
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
        const appData = getAppData(request);
        try {
            const searchData = appData[contactType].addressSearchData
            validateAppData(appData, `${pageId}/${contactType}`)
            validateSearchData(appData[contactType].addressSearchData)

            let newAppData = {
                [contactType]: {
                    addressSearchData: {
                        results: null
                    }
                }
            }

            mergeAppData(request, newAppData, `${pageId}/${contactType}`)

            const response = await getAddressesByPostcode(searchData.postcode)
            const pageData = {
                contactType: contactType,
                permitType: appData?.permitType,
                isAgent: appData?.isAgent,
                ...appData[contactType]?.addressSearchData,
                results: response.results,
                ...appData[contactType].address,
            }

            newAppData = {
                [contactType]: {
                    addressSearchData: {
                        results: response.results
                    }
                }
            }

            mergeAppData(request, newAppData, `${pageId}/${contactType}`)

            return h.view(pageId, createModel(null, pageData));
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
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
                const appData = getAppData(request);
                const pageData = {
                    contactType: request.params.contactType,
                    permitType: appData?.permitType,
                    isAgent: appData?.isAgent,
                    ...appData[request.params.contactType]?.addressSearchData,
                    ...request.payload
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const contactType = request.params.contactType
            try {
                const appData = getAppData(request);

                const selectedAddress = appData[contactType].addressSearchData.results.find(x => x.Address.UPRN === request.payload.address).Address

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

                const newAppData = {
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

                mergeAppData(request, newAppData, `${pageId}/${contactType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(`${nextPath}/${contactType}`)
        }
    },
}
]