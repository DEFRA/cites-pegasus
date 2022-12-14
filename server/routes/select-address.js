const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../lib/app-data')
const { ADDRESS_REGEX } = require('../lib/regex-validation')
const { getAddressesByPostcode } = require('../services/address-service')
const textContent = require('../content/text-content')
const postcode = require('./postcode')
const pageId = 'select-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPostcode = `${urlPrefix}/postcode`
const partyTypes = ['agent', 'applicant']
const nextPath = `${urlPrefix}/confirm-address`
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    if (data.partyType === 'applicant') {
        if (data.isAgent) {
            pageContent = textContent.selectAddress.agentLed
        } else {
            pageContent = textContent.selectAddress.applicant
        }
    } else {
        pageContent = textContent.selectAddress.agent
    }

    let bodyText = ''
    switch (data.permitType) {
        case 'import':
            bodyText = pageContent.bodyTextImport
            break;
        case 'export':
            bodyText = pageContent.bodyTextExport
            break;
        case 'reexport':
            bodyText = pageContent.bodyTextReexport
            break;
        case 'article10':
            bodyText = pageContent.bodyTextArticle10
            break;
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
        searchType: data.postcode ? `Postcode search - ${data.postcode}` : `Address search: - ${data.property}`,
        backLink: `${previousPathPostcode}/${data.partyType}`,
        searchAgainLink: `${previousPathPostcode}/${data.partyType}`,
        pageHeader: pageContent.pageHeader,
        formActionPage: `${currentPath}/${data.partyType}`,
        linkTextSearchAgain: pageContent.linkTextSearchAgain,
        bodyText: bodyText,
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
        detailsSummaryText: pageContent.detailsSummaryText,
        detailsText: pageContent.detailsText,
        detailsLinkText: pageContent.detailsLinkText,
        detailsLinkUrl: `/enter-address/${data.partyType}`
    }
    return { ...commonContent, ...model }
}

function validateSearchData(searchData) {
    if (searchData.postcode && (searchData.property || searchData.street || searchData.town)) {
        throw "must be postcode or address search, not both"
    } else if (!searchData.postcode && !searchData.property && !searchData.street && !searchData.town) {
        throw "must provide postcode or address search details"
    }
}

module.exports = [{
    method: 'GET',
    path: `${currentPath}/{partyType}`,
    options: {
        validate: {
            params: Joi.object({
                partyType: Joi.string().valid(...partyTypes)
            }),
            failAction: (request, h, error) => {
                console.log(error)
            }
        }
    },
    handler: async (request, h) => {
        const partyType = request.params.partyType
        const appData = getAppData(request);
        try {
            const searchData = appData[partyType].addressSearchData
            validateAppData(appData, `${pageId}/${partyType}`)
            validateSearchData(appData[partyType].addressSearchData)

            let newAppData = {
                [partyType]: {
                    addressSearchData: {
                        results: null
                    }
                }
            }

            setAppData(request, newAppData, `${pageId}/${partyType}`)

            const response = await getAddressesByPostcode(searchData.postcode)
            const pageData = {
                partyType: partyType,
                permitType: appData?.permitType,
                isAgent: appData?.isAgent,
                ...appData[partyType]?.addressSearchData,
                results: response.results,
                ...appData[partyType].address,
            }

            newAppData = {
                [partyType]: {
                    addressSearchData: {
                        results: response.results
                    }
                }
            }

            setAppData(request, newAppData, `${pageId}/${partyType}`)

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
    path: `${currentPath}/{partyType}`,
    options: {
        validate: {
            params: Joi.object({
                partyType: Joi.string().valid(...partyTypes)
            }),
            options: { abortEarly: false },
            payload: Joi.object({
                address: Joi.string().required()
            }),
            failAction: (request, h, err) => {
                const appData = getAppData(request);
                const pageData = {
                    partyType: request.params.partyType,
                    permitType: appData?.permitType,
                    isAgent: appData?.isAgent,
                    ...appData[request.params.partyType]?.addressSearchData,
                    ...request.payload
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const partyType = request.params.partyType
            try {
                const appData = getAppData(request);

                const selectedAddress = appData[partyType].addressSearchData.results.find(x => x.Address.UPRN === request.payload.address).Address

                const addressLine1Components = [selectedAddress.SubBuildingName, selectedAddress.BuildingNumber, selectedAddress.BuildingName, selectedAddress.Street].filter(Boolean)

                const newAppData = {
                    [partyType]: {
                        // addressSearchData: { 
                        //     results: null
                        // },
                        address: {
                            //addressSummary: request.payload.address,
                            addressLine1: addressLine1Components.join(", "),
                            addressLine2: '',
                            town: selectedAddress.Town,
                            county: selectedAddress.County,
                            postcode: selectedAddress.Postcode,
                            uprn: selectedAddress.UPRN
                        }
                    }
                }

                setAppData(request, newAppData, `${pageId}/${partyType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(`${nextPath}/${partyType}`)
        }
    },
}
]