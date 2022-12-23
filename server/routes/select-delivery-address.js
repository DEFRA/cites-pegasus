const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../lib/app-data')
const { getAddressSummary } = require('../lib/helper-functions')
const textContent = require('../content/text-content')
const pageId = 'select-delivery-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/confirm-address/applicant`
const deliveryAddressOptions = ['applicant', 'agent', 'different']
const invalidAppDataPath = urlPrefix

function createModel(errors, data) {
    const commonContent = textContent.common;
    const pageContent = textContent.selectDeliveryAddress;

    const applicantAddressSummary = getAddressSummary(data.applicantAddress)
    const agentAddressSummary = data.agentAddress ? getAddressSummary(data.agentAddress) : ''

    let deliveryAddressOptionItems = [{
        value: "applicant",
        //text: `${pageContent.radioOptionDeliverToApplicantAddress} ${applicantAddressSummary}`,
        text: applicantAddressSummary,
        checked: isChecked(data.deliveryAddressOption, "applicant")
    }]

    if (data.isAgent) {
        deliveryAddressOptionItems.push({
            value: "agent",
            //text: `${pageContent.radioOptionDeliverToAgentAddress} ${agentAddressSummary}`,
            text: agentAddressSummary,
            checked: isChecked(data.deliveryAddressOption, "agent")
        })
    }

    deliveryAddressOptionItems.push({
        value: "different",
        text: pageContent.radioOptionDeliverToDifferentAddress,
        checked: isChecked(data.deliveryAddressOption, "different")
    })


    let errorList = null
    if (errors) {
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
        const fields = ['deliveryAddressOption']
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
        backLink: previousPath,
        pageHeader: pageContent.pageHeader,
        formActionPage: currentPath,
        ...errorList ? { errorList } : {},
        pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
        changeAddressLinkText: pageContent.changeAddressLinkText,
        changeAddressLink: `/postcode/delivery`,
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
    path: `${currentPath}`,
    handler: async (request, h) => {
        const appData = getAppData(request);

        try {
            validateAppData(appData, `${pageId}`)
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidAppDataPath}/`)
        }

        const pageData = {
            isAgent: appData?.isAgent,
            permitType: appData?.permitType,
            deliveryAddressOption: appData?.delivery?.addressOption || null,
            applicantAddress: appData.applicant.address,
            agentAddress: appData.agent?.address
        }

        return h.view(pageId, createModel(null, pageData));
    }
},
{
    method: 'POST',
    path: `${currentPath}`,
    options: {
        validate: {
            options: { abortEarly: false },
            payload: Joi.object({
                deliveryAddressOption: Joi.string().required().valid(...deliveryAddressOptions)
            }),
            failAction: (request, h, err) => {
                const appData = getAppData(request);

                const pageData = {
                    isAgent: appData?.isAgent,
                    permitType: appData?.permitType,
                    deliveryAddressOption: appData?.delivery?.addressOption,
                    applicantAddress: appData.applicant.address,
                    agentAddress: appData.agent?.address
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const appData = getAppData(request)
            const deliveryAddressOption = request.payload.deliveryAddressOption
            let deliveryAddress = null

            let nextPath = `${urlPrefix}/species-name`

            switch (deliveryAddressOption) {
                case 'applicant':
                    deliveryAddress = { ...appData.applicant.address }
                    break;
                case 'agent':
                    deliveryAddress = { ...appData.agent.address }
                    break;
                case 'different':
                    deliveryAddress = null
                    nextPath = `${urlPrefix}/postcode/delivery`
                    break;
                default:
                    throw "Invalid delivery address option"

            }

            const newAppData = {
                delivery: {
                    address: deliveryAddress,
                    addressOption: request.payload.deliveryAddressOption,
                    addressSearchData: null
                }
            }

            try {
                setAppData(request, newAppData, `${pageId}`)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidAppDataPath}/`)
            }

            return h.redirect(nextPath)
        }
    }
}]