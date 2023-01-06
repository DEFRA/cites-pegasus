const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getAppData, mergeAppData, validateAppData } = require('../lib/app-data')
const { POSTCODE_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'postcode'
const currentPath = `${urlPrefix}/${pageId}`
const previousPathContactDetails = `${urlPrefix}/contact-details`
const previousPathSelectDeliveryAddress = `${urlPrefix}/select-delivery-address`
const contactTypes = ['agent', 'applicant', 'delivery']
const nextPath = `${urlPrefix}/select-address`
const invalidAppDataPath = urlPrefix


function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null
    let backLink = `${previousPathContactDetails}/${data.contactType}`

    if(data.contactType === 'applicant'){
        if(data.isAgent){
            pageContent = {...textContent.postcode.common, ...textContent.postcode.agentLed}
        } else {
            pageContent = {...textContent.postcode.common, ...textContent.postcode.applicant}
        }
    } else if (data.contactType === 'agent') {
        pageContent = {...textContent.postcode.common, ...textContent.postcode.agent}
    } else {
        pageContent = {...textContent.postcode.common, ...textContent.postcode.delivery}
        backLink = previousPathSelectDeliveryAddress
    }

    let defaultTitle = ''
    let pageHeader = ''
    
    let errorMessages = null
    switch (data.permitType) {
        case 'import':
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            errorMessages = pageContent.errorMessagesImport
            break;
        case 'export':
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            errorMessages = pageContent.errorMessagesExport
            break;
        case 'reexport':
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            errorMessages = pageContent.errorMessagesReexport
            break;
        case 'article10':
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
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
        backLink: backLink,
        pageHeader: pageHeader,
        formActionPage: `${currentPath}/${data.contactType}`,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : defaultTitle,
        linkTextEnterAddress: pageContent.linkTextEnterAddress,
        linkUrlEnterAddress: `/enter-address/${data.contactType}`,
        buttonFindAddress: pageContent.buttonFindAddress,
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
        const appData = getAppData(request);

        try {
            validateAppData(appData, `${pageId}/${request.params.contactType}`)
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
        }

        const pageData = { 
            contactType: request.params.contactType, 
            isAgent: appData?.isAgent, 
            permitType: appData?.permitType, 
            postcode: appData[request.params.contactType]?.addressSearchData?.postcode 
        }

        return h.view(pageId, createModel(null, pageData));
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
                postcode: Joi.string().regex(POSTCODE_REGEX).required()
            }),
            failAction: (request, h, err) => {
                const appData = getAppData(request);
                const pageData = { 
                    contactType: request.params.contactType, 
                    isAgent: appData?.isAgent, 
                    permitType: appData?.permitType, 
                    ...request.payload 
                }
                
                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const contactType = request.params.contactType


            const appData = {
                [contactType]: {
                    addressSearchData: {               
                        postcode: request.payload.postcode.trim()
                    }
                }
            }

            try {
                mergeAppData(request, appData, `${pageId}/${contactType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(`${nextPath}/${contactType}`)
        }
    },
}]