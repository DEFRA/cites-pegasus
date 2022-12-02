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
const previousPathAddress = `${urlPrefix}/search-address`
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

    //TODO - GET REAL ADDRESS RESULTS
    //const searchResults = null;
    //const searchResults = [{ value: "3 Station Road", text: "3 Station Road, The Locality, The City, The County, B74 4DG" }];
    const searchResults = [{ value: "3 Station Road", text: "3 Station Road, The Locality, The City, The County, B74 4DG" }, { value: "45 Main Street", text: "45 Main Street, The Locality, The City, The County, B74 4DG" }];
    let addressSelectItems = []

    if (data.results && data.results.length > 0) {
        if (data.results.length === 1) {
            addressSelectItems.push({ value: "", text: pageContent.selectAddressPromptSingle })
        } else {
            addressSelectItems.push({ value: "", text: `${data.results.length} ${pageContent.selectAddressPromptMultiple}` })
        }
        data.results.forEach(res => { addressSelectItems.push({ value: res.Address.UPRN, text: res.Address.AddressLine }) })
        //addressSelectItems = [...addressSelectItems, ...searchResults]

    } else {
        addressSelectItems.push({ value: "", text: pageContent.selectAddressPromptNoResults })
    }


    const model = {
        searchType: data.postcode ? `Postcode search - ${data.postcode}` : `Address search: - ${data.property}`,
        backLink: `${data.postcode ? previousPathPostcode : previousPathAddress}/${data.partyType}`,
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
        const appData = getAppData(request);
        let searchResponse = null
        try {
            const searchData = appData[request.params.partyType].addressSearchData
            validateAppData(appData, `${pageId}/${request.params.partyType}`)
            validateSearchData(appData[request.params.partyType].addressSearchData)
            const response = await getAddressesByPostcode(searchData.postcode)
            const pageData = {
                partyType: request.params.partyType,
                permitType: appData?.permitType,
                isAgent: appData?.isAgent,
                ...appData[request.params.partyType]?.addressSearchData,
                results: response.results
            }
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

            const appData = {
                [partyType]: {
                    address: {
                        manualEntry: false,
                        //addressSummary: request.payload.address,
                        addressLine1: '3 The Road',//TODO Pull the full address data from the api
                        addressLine2: 'The Area',
                        town: 'The Town',
                        county: 'The County',
                        postcode: 'AB1 2CD'
                    }
                }
            }

            try {
                setAppData(request, appData, `${pageId}/${partyType}`)
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