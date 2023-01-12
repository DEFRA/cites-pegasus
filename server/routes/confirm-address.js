const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { getAppData, mergeAppData, validateAppData } = require('../lib/app-data')
const textContent = require('../content/text-content')
const pageId = 'confirm-address'
const currentPath = `${urlPrefix}/${pageId}`
const contactTypes = ['agent', 'applicant', 'delivery']
const invalidAppDataPath = urlPrefix
const lodash = require('lodash')

function createModel(errors, data) {
    const commonContent = textContent.common;
    let pageContent = null

    if (data.contactType === 'applicant') {
        if (data.isAgent) {
            pageContent = lodash.merge(textContent.enterAddress.common, textContent.confirmAddress.agentLed )
        } else {
            pageContent = lodash.merge(textContent.enterAddress.common, textContent.confirmAddress.applicant )
        }
    } else if (data.contactType === 'agent') {
        pageContent = lodash.merge(textContent.enterAddress.common, textContent.confirmAddress.agent )
    } else {
        pageContent = lodash.merge(textContent.enterAddress.common, textContent.confirmAddress.delivery )
    }

    let previousPath = ''
    if (!data.addressOption || data.addressOption === 'different'){
        previousPath = data.address.uprn ? `${urlPrefix}/select-address/${data.contactType}` : `${urlPrefix}/enter-address/${data.contactType}`
    } else {
        previousPath = `${urlPrefix}/select-delivery-address`
    }


    // if(!data.addressSearchData){
    //     previousPath = data.address.uprn ? `${urlPrefix}/select-address` : `${urlPrefix}/enter-address`
    // }

    let defaultTitle = ''
    let pageHeader = ''

    switch (data.permitType) {
        case 'import':
            defaultTitle = pageContent.defaultTitleImport
            pageHeader = pageContent.pageHeaderImport
            break;
        case 'export':
            defaultTitle = pageContent.defaultTitleExport
            pageHeader = pageContent.pageHeaderExport
            break;
        case 'reexport':
            defaultTitle = pageContent.defaultTitleReexport
            pageHeader = pageContent.pageHeaderReexport
            break;
        case 'article10':
            defaultTitle = pageContent.defaultTitleArticle10
            pageHeader = pageContent.pageHeaderArticle10
            break;
    }

    const model = {
        backLink: previousPath,
        pageHeader: pageHeader,
        formActionPage: `${currentPath}/${data.contactType}`,
        pageTitle: defaultTitle,
        addressLine1: data.address.addressLine1,
        addressLine2: data.address.addressLine2,
        addressLine3: data.address.addressLine3,
        addressLine4: data.address.addressLine4,
        postcode: data.address.postcode,
        country: data.address.country,
        showCountry: data.address.country && data.contactType !== 'delivery',
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
            ...appData[request.params.contactType],
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
                const appData = getAppData(request);
                const pageData = {
                    contactType: request.params.contactType,
                    isAgent: appData?.isAgent,
                    permitType: appData?.permitType,
                    ...appData[request.params.contactType],
                }

                return h.view(pageId, createModel(err, pageData)).takeover()
            }
        },
        handler: async (request, h) => {
            let nextPath = ''
            if (request.params.contactType === 'agent') {
                nextPath = `${urlPrefix}/contact-details/applicant`
            } else if (request.params.contactType === 'applicant') {
                nextPath = `${urlPrefix}/select-delivery-address`
            } else {
                nextPath = `${urlPrefix}/species-name/0`
            }
            return h.redirect(nextPath)
        }
    },
}
]