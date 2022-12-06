const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../lib/app-data')
const { POSTCODE_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'postcode'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/contact-details`
const partyTypes = ['agent', 'applicant']
const nextPath = `${urlPrefix}/select-address`
const invalidAppDataPath = urlPrefix


function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    if(data.partyType === 'applicant'){
        if(data.isAgent){
            pageContent = textContent.postcode.agentLed
        } else {
            pageContent = textContent.postcode.applicant
        }
    } else {
        pageContent = textContent.postcode.agent
    }

    let defaultTitle = ''
    let pageHeader = ''
    let linkTextInternationalAddress = ''
    let errorMessages = null
    switch (data.permitType) {
        case 'import':
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            linkTextInternationalAddress = pageContent.linkTextInternationalAddressImport
            errorMessages = pageContent.errorMessagesImport
            break;
        case 'export':
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            linkTextInternationalAddress = pageContent.linkTextInternationalAddressExport
            errorMessages = pageContent.errorMessagesExport
            break;
        case 'reexport':
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            linkTextInternationalAddress = pageContent.linkTextInternationalAddressReexport
            errorMessages = pageContent.errorMessagesReexport
            break;
        case 'article10':
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
            linkTextInternationalAddress = pageContent.linkTextInternationalAddressArticle10
            errorMessages = pageContent.errorMessagesArticle10
            break;
    }

    let errorList = null
    if(errors){
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...errorMessages }
        const fields = ['postcode']
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
    
    const model = {
        backLink: `${previousPath}/${data.partyType}`,
        pageHeader: pageHeader,
        formActionPage: `${currentPath}/${data.partyType}`,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : defaultTitle,
        linkTextUnknownPostcode: pageContent.linkTextUnknownPostcode,
        linkUrlUnknownPostcode: `/search-address/${data.partyType}`,
        linkTextInternationalAddress: linkTextInternationalAddress,
        linkUrlInternationalAddress: `/international-address/${data.partyType}`,
        inputPostcode: {
            label: {
                text: pageContent.inputLabelPostcode
            },
            id: "postcode",
            name: "postcode",
            classes: "govuk-!-width-two-thirds",
            ...(data.postcode ? { value: data.postcode } : {}),
            errorMessage: getFieldError(errorList, '#postcode')
        },
    }
    
    return { ...commonContent, ...model }
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
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
        }

        const pageData = { 
            partyType: request.params.partyType, 
            isAgent: appData?.isAgent, 
            permitType: appData?.permitType, 
            postcode: appData[request.params.partyType].addressSearchData?.postcode 
        }

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
                postcode: Joi.string().regex(POSTCODE_REGEX).required()
            }),
            failAction: (request, h, err) => {
                const appData = getAppData(request);
                const pageData = { 
                    partyType: request.params.partyType, 
                    isAgent: appData?.isAgent, 
                    permitType: appData?.permitType, 
                    ...request.payload 
                }
                
                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const partyType = request.params.partyType


            const appData = {
                [partyType]: {
                    addressSearchData: {
                        property: null,
                        street: null,    
                        town: null,                    
                        postcode: request.payload.postcode.trim()
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
}]