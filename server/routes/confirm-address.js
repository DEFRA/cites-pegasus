const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../lib/app-data')
const textContent = require('../content/text-content')
const pageId = 'confirm-address'
const currentPath = `${urlPrefix}/${pageId}`
//const previousPath = `${urlPrefix}/select-address`
const partyTypes = ['agent', 'applicant']
const deliveryAddressOptions = ['this', 'different', 'agent']
const invalidAppDataPath = urlPrefix


function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null
    let deliveryAddressOptionItems = []

    if (data.partyType === 'applicant') {
        if (data.isAgent) {
            pageContent = textContent.confirmAddress.agentLed

            deliveryAddressOptionItems.push({
                value: "this",
                text: pageContent.radioOptionDeliverToThisAddress,
                checked: isChecked(data.deliveryAddressOption, "this")
            })
            deliveryAddressOptionItems.push({
                value: "different",
                text: pageContent.radioOptionDeliverToDifferentAddress,
                checked: isChecked(data.deliveryAddressOption, "different")
            })
            deliveryAddressOptionItems.push({
                value: "agent",
                text: `${pageContent.radioOptionDeliverToAgentAddress} ${data.agentAddressSummary}`,
                checked: isChecked(data.deliveryAddressOption, "agent")
            })
        } else {
            pageContent = textContent.confirmAddress.applicant

            deliveryAddressOptionItems.push({
                value: "this",
                text: pageContent.radioOptionDeliverToThisAddress
                //checked: isChecked(data.deliveryAddressOption, "this")
            })
            deliveryAddressOptionItems.push({
                value: "different",
                text: pageContent.radioOptionDeliverToDifferentAddress
                //checked: isChecked(data.deliveryAddressOption, "different")
            })
        }
    } else {
        pageContent = textContent.confirmAddress.agent
    }

    // let defaultTitle = ''
    // let pageHeader = ''
    // let errorMessages = null

    // switch (data.permitType) {
    //     case 'import':
    //         defaultTitle = pageContent.defaultTitleImport
    //         pageHeader = pageContent.pageHeaderImport
    //         errorMessages = pageContent.errorMessagesImport
    //         break;
    //     case 'export':
    //         defaultTitle = pageContent.defaultTitleExport
    //         pageHeader = pageContent.pageHeaderExport
    //         errorMessages = pageContent.errorMessagesExport
    //         break;
    //     case 'reexport':
    //         defaultTitle = pageContent.defaultTitleReexport
    //         pageHeader = pageContent.pageHeaderReexport
    //         errorMessages = pageContent.errorMessagesReexport
    //         break;
    //     case 'article10':
    //         defaultTitle = pageContent.defaultTitleArticle10
    //         pageHeader = pageContent.pageHeaderArticle10
    //         errorMessages = pageContent.errorMessagesArticle10
    //         break;
    // }

    let errorList = null
    // if (errors) {
    //     errorList = []
    //     const mergedErrorMessages = { ...commonContent.errorMessages, ...errorMessages }
    //     const fields = ['addressLine1', 'town', 'postcode']
    //     fields.forEach(field => {
    //         const fieldError = findErrorList(errors, [field], mergedErrorMessages)[0]
    //         if (fieldError) {
    //             errorList.push({
    //                 text: fieldError,
    //                 href: `#${field}`
    //             })
    //         }
    //     })
    // }

    const model = {
        //backLink: `${previousPath}/${data.partyType}`
        pageHeader: pageContent.pageHeader,
        formActionPage: `${currentPath}/${data.partyType}`,
        // ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        town: data.town,
        county: data.county,
        postcode: data.postcode,
        changeAddressLinkText: pageContent.changeAddressLinkText,
        changeAddressLink: `/postcode/${data.partyType}`,
        inputDeliveryAddressOptions: {
            idPrefix: "deliveryAddressOption",
            name: "deliveryAddressOption",
            fieldset: {
                legend: {
                    text: pageContent.heading,
                    isPageHeading: true,
                    classes: "govuk-fieldset__legend--l"
                }
            },
            items: deliveryAddressOptionItems,
            errorMessage: getFieldError(errorList, '#deliveryAddressOption')
        }
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
            deliveryAddressOption: appData?.deliveryAddressOption,
            ...appData[request.params.partyType].address,
            agentAddressSummary: null// appData[agent]?.address.addressSummary 
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
                deliveryAddressOption: Joi.string().valid(...deliveryAddressOptions).allow(null)
            }),
            failAction: (request, h, err) => {
                const appData = getAppData(request);
                const pageData = {
                    partyType: request.params.partyType,
                    isAgent: appData?.isAgent,
                    permitType: appData?.permitType,
                    deliveryAddressOption: request.payload.deliveryAddressOption,
                    ...appData[request.params.partyType].address,
                    agentAddressSummary: null// appData[agent]?.address.addressSummary 
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const appData = getAppData(request)
            const partyType = request.params.partyType
            const deliveryAddressOption = request.payload.deliveryAddressOption
            let nextPath = null
            let deliveryAddress = null

            switch (partyType) {
                case 'agent':
                    nextPath = `${urlPrefix}/contact-details/applicant`
                    break;

                case 'applicant':
                    if (appData.isAgent === true) { //Agent Led
                        if (deliveryAddressOption === 'this') {
                            deliveryAddress = { ...appData.applicant.address }
                            nextPath = `${urlPrefix}/species-name`
                            break;
                        }
                        if (deliveryAddressOption === 'agent') {
                            deliveryAddress = { ...appData.agent.address }
                            nextPath = `${urlPrefix}/species-name`
                            break;
                        }
                        if (deliveryAddressOption === 'different') {
                            deliveryAddress = null
                            nextPath = `${urlPrefix}/postcode/delivery`
                            break;
                        }
                        throw "Invalid delivery address option"
                    } else { //Applicant
                        if (deliveryAddressOption === 'this') {
                            deliveryAddress = { ...appData.applicant.address }
                            nextPath = `${urlPrefix}/species-name`
                            break;
                        }
                        if (deliveryAddressOption === 'different') {
                            deliveryAddress = null
                            nextPath = `${urlPrefix}/postcode/delivery`
                            break;
                        }
                        throw "Invalid delivery address option"
                    }
                    break;
                default:
                    throw 'Invalid party type'
            }

            const newAppData = {
                deliveryAddress: deliveryAddress,
                deliveryAddressOption: request.payload.deliveryAddressOption
            }

            try {
                setAppData(request, newAppData, `${pageId}/${partyType}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(nextPath)            
        }
    },
}
]