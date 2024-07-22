const Joi = require('joi')
const { urlPrefix, enableDeliveryType } = require('../../config/config')
const { getSubmission, mergeSubmission, validateSubmission, getApplicationIndex, saveDraftSubmission } = require('../lib/submission')
const { permitType: pt } = require('../lib/permit-type-helper')
const { checkChangeRouteExit } = require("../lib/change-route")
const textContent = require('../content/text-content')
const pageId = 'confirm-address'
const currentPath = `${urlPrefix}/${pageId}`
const contactTypes = ['applicant', 'delivery']
const invalidSubmissionPath = `${urlPrefix}/`
const lodash = require('lodash')

function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    if (data.contactType === 'applicant') {
        if (data.isAgent) {
            pageContent = lodash.merge(textContent.confirmAddress.common, textContent.confirmAddress.agentLed)
        } else {
            pageContent = lodash.merge(textContent.confirmAddress.common, textContent.confirmAddress.applicant)
        }
    } else {
        pageContent = lodash.merge(textContent.confirmAddress.common, textContent.confirmAddress.delivery)
    }

    let previousPath = ''
    if (!data.addressOption || data.addressOption === 'different') {
        previousPath = data.selectedAddress.uprn ? `${urlPrefix}/select-address/${data.contactType}` : `${urlPrefix}/enter-address/${data.contactType}`
    } else {
        previousPath = `${urlPrefix}/select-delivery-address`
    }

    let defaultTitle = ''
    let pageHeader = ''

    switch (data.permitType) {
        case pt.IMPORT:
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            break
        case pt.EXPORT:
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            break
        case pt.MIC:
        case pt.TEC:
        case pt.POC:
        case pt.REEXPORT:
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            break
        case pt.ARTICLE_10:
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
            break
    }

    const model = {
        backLink: previousPath,
        pageHeader: pageHeader,
        formActionPage: `${currentPath}/${data.contactType}`,
        pageTitle: defaultTitle + commonContent.pageTitleSuffix,
        deliveryName: data.selectedAddress.deliveryName,
        showDeliveryName: data.selectedAddress.deliveryName && data.contactType === 'delivery',
        addressLine1: data.selectedAddress.addressLine1,
        addressLine2: data.selectedAddress.addressLine2,
        addressLine3: data.selectedAddress.addressLine3,
        addressLine4: data.selectedAddress.addressLine4,
        postcode: data.selectedAddress.postcode,
        country: data.selectedAddress.country,
        countryDesc: data.selectedAddress.countryDesc,
        showCountry: data.selectedAddress.country && data.contactType !== 'delivery',
        changeAddressLinkText: pageContent.changeAddressLinkText,
        changeAddressLink: `/postcode/${data.contactType}`,
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
        const submission = getSubmission(request);

        try {
            validateSubmission(submission, `${pageId}/${request.params.contactType}`)
        }
        catch (err) {
            console.error(err);
            return h.redirect(invalidSubmissionPath)
        }

        const pageData = {
            contactType: request.params.contactType,
            isAgent: submission?.isAgent,
            permitType: submission?.permitType,
            ...submission[request.params.contactType].candidateAddressData,
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
            failAction: (request, h, err) => {
                const submission = getSubmission(request);
                const pageData = {
                    contactType: request.params.contactType,
                    isAgent: submission?.isAgent,
                    permitType: submission?.permitType,
                    ...submission[request.params.contactType]?.candidateAddressData,
                }
                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            const submission = getSubmission(request)
            const { contactType } = request.params
            const { candidateAddressData } = submission[contactType]

            const newSubmission = {
                [contactType]: {
                    address: candidateAddressData.selectedAddress
                }
            }

            if (candidateAddressData.addressOption) {
                newSubmission[contactType].addressOption = candidateAddressData.addressOption
            }

            try {
                mergeSubmission(request, newSubmission, `${pageId}/${contactType}`)
            }
            catch (err) {
                console.error(err);
                return h.redirect(invalidSubmissionPath)
            }

            let nextPath = ''
            if (contactType === 'agent') {
                nextPath = `${urlPrefix}/contact-details/applicant`
            } else if (contactType === 'applicant') {
                nextPath = `${urlPrefix}/select-delivery-address`
            } else {
                const { applicationStatuses } = validateSubmission(submission, null)
                const applicationIndex = getApplicationIndex(applicationStatuses)
                nextPath = enableDeliveryType ? `${urlPrefix}/delivery-type` : `${urlPrefix}/species-name/${applicationIndex}`
            }

            const exitChangeRouteUrl = checkChangeRouteExit(request, false)
            if (exitChangeRouteUrl) {
                saveDraftSubmission(request, exitChangeRouteUrl)
                return h.redirect(exitChangeRouteUrl)
            }

            saveDraftSubmission(request, nextPath)
            return h.redirect(nextPath)
        }
    },
}
]