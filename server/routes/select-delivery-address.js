const Joi = require('joi')
const { urlPrefix, enableDeliveryType } = require('../../config/config')
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, getApplicationIndex, saveDraftSubmission } = require('../lib/submission')
const { getAddressSummary } = require('../lib/helper-functions')
const textContent = require('../content/text-content')
const pageId = 'select-delivery-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/confirm-address/applicant`
const deliveryAddressOptions = ['applicant', 'different']
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
    const commonContent = textContent.common;
    const pageContent = textContent.selectDeliveryAddress;

    const applicantAddressSummary = getAddressSummary(data.applicantAddress)
    
    let deliveryAddressOptionItems = [{
        value: "applicant",
        //text: `${pageContent.radioOptionDeliverToApplicantAddress} ${applicantAddressSummary}`,
        text: applicantAddressSummary,
        checked: isChecked(data.deliveryAddressOption, "applicant")
    }]

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
                    text: pageContent.pageHeader,
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
        const submission = getSubmission(request);

        try {
            validateSubmission(submission, `${pageId}`)
        }
        catch (err) {
            console.error(err);
            return h.redirect(invalidSubmissionPath)
        }

        const pageData = {
            permitType: submission?.permitType,
            deliveryAddressOption: submission?.delivery?.addressOption || null,
            applicantAddress: submission.applicant.address            
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
                    permitType: submission?.permitType,
                    deliveryAddressOption: submission?.delivery?.addressOption,
                    applicantAddress: submission.applicant.address
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const submission = getSubmission(request)
            const deliveryAddressOption = request.payload.deliveryAddressOption
            let deliveryAddress = null
            const { applicationStatuses } = validateSubmission(submission, pageId)            
            const applicationIndex = getApplicationIndex(submission, applicationStatuses)

            let nextPath = enableDeliveryType ?  `${urlPrefix}/delivery-type` : `${urlPrefix}/species-name/${applicationIndex}`

            switch (deliveryAddressOption) {
                case 'applicant':
                    deliveryAddress = { ...submission.applicant.address }
                    break;                
                case 'different':
                    nextPath = `${urlPrefix}/postcode/delivery`
                    break;
                default:
                    throw new Error("Invalid delivery address option")

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
                console.error(err);
                return h.redirect(`${invalidSubmissionPath} / `)
            }

            saveDraftSubmission(request, nextPath)
            return h.redirect(nextPath)            
        }
    }
}]