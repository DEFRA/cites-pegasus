const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const { getAddressSummary } = require('../lib/helper-functions')
const textContent = require('../content/text-content')
const pageId = 'select-delivery-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/confirm-address/applicant`
const deliveryAddressOptions = ['applicant', 'agent', 'different']
const invalidSubmissionPath = urlPrefix

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

function getApplicationIndex (submission, path) {

    const applicationStatuses = validateSubmission(submission, path)

    let applicationIndex = 0

    const appInProgressIndex = applicationStatuses.find(item => item.status === 'in-progress')
    if (appInProgressIndex) {
        applicationIndex = appInProgressIndex.applicationIndex
    } else if (applicationStatuses.length > 0) {
        applicationIndex = applicationStatuses.length - 1
    }
    return applicationIndex
}

module.exports = [{
    method: 'GET',
    path: `${currentPath}`,
    handler: async (request, h) => {
        const submission = getSubmission(request);

        try {
            validateSubmission(submission, `${pageId}`)
        }
        catch (err) {
            console.log(err);
            return h.redirect(`${invalidSubmissionPath}/`)
        }

        const pageData = {
            isAgent: submission?.isAgent,
            permitType: submission?.permitType,
            deliveryAddressOption: submission?.delivery?.addressOption || null,
            applicantAddress: submission.applicant.address,
            agentAddress: submission.agent?.address
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
                const submission = getSubmission(request);

                const pageData = {
                    isAgent: submission?.isAgent,
                    permitType: submission?.permitType,
                    deliveryAddressOption: submission?.delivery?.addressOption,
                    applicantAddress: submission.applicant.address,
                    agentAddress: submission.agent?.address
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const submission = getSubmission(request)
            const deliveryAddressOption = request.payload.deliveryAddressOption
            let deliveryAddress = null
                        
            const applicationIndex = getApplicationIndex(submission, pageId)

            let nextPath = `${urlPrefix}/species-name/${applicationIndex}`

            switch (deliveryAddressOption) {
                case 'applicant':
                    deliveryAddress = { ...submission.applicant.address }
                    break;
                case 'agent':
                    deliveryAddress = { ...submission.agent.address }
                    break;
                case 'different':
                    deliveryAddress = null
                    nextPath = `${urlPrefix}/postcode/delivery`
                    break;
                default:
                    throw "Invalid delivery address option"

            }

            const newSubmission = {
                delivery: {
                    address: deliveryAddress,
                    addressOption: request.payload.deliveryAddressOption,
                    candidateAddressData: {
                        addressSearchData: null,
                        selectedAddress: null
                        
                    }
                }
            }


            try {
                mergeSubmission(request, newSubmission, pageId)
            }
            catch (err) {
                console.log(err);
                return h.redirect(`${invalidSubmissionPath} / `)
            }

            return h.redirect(nextPath)
        }
    }
}]