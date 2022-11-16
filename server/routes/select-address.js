const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../helpers/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../helpers/app-data')
const { ADDRESS_REGEX } = require('../helpers/regex-validation')
const textContent = require('../content/text-content')
const postcode = require('./postcode')
const pageId = 'select-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathPostcode = `${urlPrefix}/postcode`
const previousPathAddress = `${urlPrefix}/search-address`
const partyTypes = ['agent', 'applicant']
//const nextPath = `${urlPrefix}/select-address`
const invalidAppDataPath = urlPrefix

function createModel(errorList, data) {
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
    
    //TODO - GET REAL ADDRESS RESULTS
    //const searchResults = null;
    //const searchResults = [{ value: "3 Station Road", text: "3 Station Road, The Locality, The City, The County, B74 4DG" }];
    const searchResults = [{ value: "3 Station Road", text: "3 Station Road, The Locality, The City, The County, B74 4DG" }, { value: "45 Main Street", text: "45 Main Street, The Locality, The City, The County, B74 4DG" }];
    let addressSelectItems = []

    if (searchResults && searchResults.length > 0) {
        if (searchResults.length === 1) {
            addressSelectItems.push({ value: "", text: pageContent.selectAddressPromptSingle })
        } else {
            addressSelectItems.push({ value: "", text: `${searchResults.length} ${pageContent.selectAddressPromptMultiple}` })
        }
        addressSelectItems = [...addressSelectItems, ...searchResults]

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
            classes: "govuk-!-width-two-thirds"
        },
        detailsSummaryText: pageContent.detailsSummaryText,
        detailsText: pageContent.detailsText,
        detailsLinkText: pageContent.detailsLinkText,
        detailsLinkUrl: "/enter-address"
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

        try {
            validateAppData(appData, `${pageId}/${request.params.partyType}`)
            validateSearchData(appData[request.params.partyType].addressSearchData)
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
        }

        const pageData = { partyType: request.params.partyType, permitType: appData.permitType, isAgent: appData.isAgent, ...appData[request.params.partyType].addressSearchData }
        return h.view(pageId, createModel(null, pageData));

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
                const errorList = []
                const fields = ['address']
                fields.forEach(field => {
                    const fieldError = findErrorList(err, [field])[0]
                    if (fieldError) {
                        errorList.push({
                            text: fieldError,
                            href: `#${field}`
                        })
                    }
                })

                const appData = getAppData(request);
                const pageData = { partyType: request.params.partyType, permitType: appData.permitType, isAgent: appData.isAgent, ...request.payload }
                return h.view(pageId, createModel(errorList, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const partyType = request.params.partyType

            const appData = {
                [partyType]: {
                    address: request.payload.address
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