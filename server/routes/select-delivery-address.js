const Joi = require('joi')
const { urlPrefix, enableDeliveryType } = require('../../config/config')
const { findErrorList, getFieldError, isChecked } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission, getApplicationIndex, saveDraftSubmission } = require('../lib/submission')
const { ADDRESS_REGEX } = require('../lib/regex-validation')
const { getAddressSummary } = require('../lib/helper-functions')
const textContent = require('../content/text-content')
const nunjucks = require("nunjucks")
const pageId = 'select-delivery-address'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/confirm-address/applicant`
const deliveryAddressOptions = ['applicant', 'different']
const invalidSubmissionPath = `${urlPrefix}/`

function createModel(errors, data) {
    const commonContent = textContent.common;
    const pageContent = textContent.selectDeliveryAddress;

    const applicantAddressSummary = getAddressSummary(data.applicantAddress)

    let errorList = null
    if (errors) {
        errorList = []
        const mergedErrorMessages = { ...commonContent.errorMessages, ...pageContent.errorMessages }
        const fields = ['deliveryAddressOption', 'deliveryName']
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

    const renderString = "{% from 'govuk/components/input/macro.njk' import govukInput %} \n {{govukInput(input)}}"

    nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })
    
    const deliveryNameInput = nunjucks.renderString(renderString, {
        input: {
            id: "deliveryName",
            name: "deliveryName",
            classes: "govuk-input govuk-input--width-20",
            autocomplete: "on",
            label: {
                text: pageContent.inputLabelDeliveryName
            },
            // hint: {  //TODO
            //     text: pageContent.inputLabelDeliveryNameHint
            // },
            ...(data.deliveryName ? { value: data.deliveryName } : {}),
            errorMessage: getFieldError(errorList, "#deliveryName")
        }
    })


    let deliveryAddressOptionItems = [{
        value: "applicant",
        //text: `${pageContent.radioOptionDeliverToApplicantAddress} ${applicantAddressSummary}`,
        text: applicantAddressSummary,
        checked: isChecked(data.deliveryAddressOption, "applicant"),
        conditional: {
            html: deliveryNameInput
        }
    }]

    deliveryAddressOptionItems.push({
        value: "different",
        text: pageContent.radioOptionDeliverToDifferentAddress,
        checked: isChecked(data.deliveryAddressOption, "different")
    })

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
            applicantAddress: submission.applicant.address,
            deliveryName: submission?.delivery?.address?.deliveryName
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
                deliveryAddressOption: Joi.string().required().valid(...deliveryAddressOptions),
                deliveryName: Joi.string().max(150).regex(ADDRESS_REGEX).optional().allow('', null),
            }),
            failAction: (request, h, err) => {
                const submission = getSubmission(request);

                const pageData = {
                    permitType: submission?.permitType,
                    deliveryAddressOption: submission?.delivery?.addressOption,
                    applicantAddress: submission.applicant.address,
                    deliveryName: request.payload.deliveryName
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

            let nextPath = enableDeliveryType ? `${urlPrefix}/delivery-type` : `${urlPrefix}/species-name/${applicationIndex}`

            switch (deliveryAddressOption) {
                case 'applicant':
                    deliveryAddress = { deliveryName: request.payload.deliveryName, ...submission.applicant.address }
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