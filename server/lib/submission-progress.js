const { permitType: pt, permitTypeOption: pto } = require('../lib/permit-type-helper')
const config = require('../../config/config')

let applicationStatuses
let submissionProgress
let completeApplications


function getSubmissionProgress(submission, includePageData) {
    if (!submission) {
        return { submissionProgress, applicationStatuses }
    }

    applicationStatuses = []
    submissionProgress = []
    completeApplications = 0


    if (submission.submissionRef) {
        //Submitted application
        submissionProgress.push(getPageProgess('pay-application'))
        if (submission.paymentDetails) {
            submissionProgress.push(getPageProgess('application-complete'))
            submissionProgress.push(getPageProgess('govpay'))
            submissionProgress.push(getPageProgess('payment-problem'))
        }
        if (submission.applications?.length > 0) {
            submission.applications.forEach((_application, applicationIndex) => {
                submissionProgress.push(getPageProgess(`application-summary/view-submitted/${applicationIndex}`, applicationIndex))
            })
        }
    }
    //Non submitted application
    submissionProgress.push(getPageProgess('permit-type', null, includePageData, getPageDataSimple('permitTypeOption', submission.permitTypeOption)))

    if (submission.permitTypeOption === pto.OTHER) {
        submissionProgress.push(getPageProgess('other-permit-type', null, includePageData, getPageDataSimple('otherPermitTypeOption', submission.otherPermitTypeOption)))
    }

    if (submission.otherPermitTypeOption === pto.OTHER) {
        submissionProgress.push(getPageProgess('cannot-use-service'))
        return { submissionProgress, applicationStatuses }
    }

    if (!submission.permitType) {
        return { submissionProgress, applicationStatuses }
    }

    if (submission.permitType && submission.otherPermitTypeOption !== pto.OTHER) {
        submissionProgress.push(getPageProgess('guidance-completion'))
    }

    submissionProgress.push(getPageProgess('applying-on-behalf', null, includePageData, getPageDataSimple('isAgent', submission.isAgent)))

    if (typeof submission.isAgent !== 'boolean') {
        return { submissionProgress, applicationStatuses }
    }

    submissionProgress.push(getPageProgess('contact-details/applicant', null, includePageData, getPageDataContactDetails(submission.applicant)))

    if (!submission.applicant?.fullName) {
        return { submissionProgress, applicationStatuses }
    }

    submissionProgress.push(getPageProgess('postcode/applicant'))
    submissionProgress.push(getPageProgess('enter-address/applicant'))

    if (submission.applicant?.candidateAddressData?.addressSearchData?.postcode) {
        submissionProgress.push(getPageProgess('select-address/applicant'))
    }

    if (submission.applicant?.candidateAddressData?.selectedAddress) {
        submissionProgress.push(getPageProgess('confirm-address/applicant', null, includePageData, getPageDataSimple('applicant-address', submission.applicant?.address)))
    }


    if (!submission.applicant?.address) {
        return { submissionProgress, applicationStatuses }
    }

    submissionProgress.push(getPageProgess('select-delivery-address', null, includePageData, getPageDataSimple('delivery-address', submission.delivery?.address)))
    submissionProgress.push(getPageProgess('postcode/delivery'))
    submissionProgress.push(getPageProgess('enter-address/delivery'))

    if (submission.delivery?.candidateAddressData?.addressSearchData?.postcode) {
        submissionProgress.push(getPageProgess('select-address/delivery'))
    }

    if (submission.delivery?.candidateAddressData?.selectedAddress) {
        submissionProgress.push(getPageProgess('confirm-address/delivery', null, includePageData, getPageDataSimple('delivery-address', submission.delivery?.address)))
    }

    if (!submission.delivery?.address) {
        return { submissionProgress, applicationStatuses }
    }

    let initialApplication
    if (submission.applications?.length > 0) {
        initialApplication = submission.applications[0]
    }

    if (config.enableDeliveryType) {
        submissionProgress.push(getPageProgess('delivery-type', null, includePageData, getPageDataSimple('deliveryType', submission.delivery?.deliveryType)))

        if (submission.delivery?.deliveryType) {
            submissionProgress.push(getPageProgess('species-name/0', 0, includePageData, getPageDataSimple('speciesName', initialApplication?.species?.speciesName)))
        }
    } else {
        submissionProgress.push(getPageProgess('species-name/0', 0, includePageData, getPageDataSimple('speciesName', initialApplication?.species?.speciesName)))
    }

    if (submission.applications?.length === 0) {
        return { submissionProgress, applicationStatuses }
    }

    submission.applications.forEach((application, applicationIndex) => {
        getApplicationProgress(application, applicationIndex, includePageData, submission)
    })

    if (completeApplications > 0 && !submission.submissionRef) {
        submissionProgress.push(getPageProgess(`your-submission`))
        submissionProgress.push(getPageProgess(`your-submission/are-you-sure/permit-type`))
        submissionProgress.push(getPageProgess(`your-submission/are-you-sure/remove`))
        submissionProgress.push(getPageProgess(`your-submission/create-application`))
        submissionProgress.push(getPageProgess(`add-application`))
        submissionProgress.push(getPageProgess('upload-supporting-documents'))
        submissionProgress.push(getPageProgess('declaration'))
    }

    return { submissionProgress, applicationStatuses }
}

function getApplicationProgress(application, applicationIndex, includePageData, submission) {
    applicationStatuses.push({ applicationIndex: applicationIndex, status: 'in-progress' })

    submissionProgress.push(getPageProgess(`application-summary/check/${applicationIndex}`, applicationIndex))
    submissionProgress.push(getPageProgess(`application-summary/copy/${applicationIndex}`, applicationIndex))
    submissionProgress.push(getPageProgess(`application-summary/are-you-sure/check/${applicationIndex}`, applicationIndex))
    submissionProgress.push(getPageProgess(`application-summary/copy-as-new/${applicationIndex}`, applicationIndex))
    submissionProgress.push(getPageProgess(`application-summary/are-you-sure/copy-as-new/${applicationIndex}`, applicationIndex))
    submissionProgress.push(getPageProgess(`application-summary/are-you-sure/copy/${applicationIndex}`, applicationIndex))

    if (applicationIndex > 0) {
        submissionProgress.push(getPageProgess(`species-name/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('speciesName', application?.species?.speciesName)))
    }

    const species = application.species

    if (!species?.speciesName) {
        return
    }

    if (species.hasRestriction) {
        submissionProgress.push(getPageProgess(`species-warning/${applicationIndex}`, applicationIndex))
    }

    submissionProgress.push(getPageProgess(`source-code/${applicationIndex}`, applicationIndex, includePageData, getPageDataSourceCode(species)))

    if (!species.sourceCode) {
        return
    }

    if (submission.permitType === pt.ARTICLE_10) {
        submissionProgress.push(getPageProgess(`specimen-origin/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('specimenOrigin', species.specimenOrigin)))
        if (species.specimenOrigin) {
            submissionProgress.push(getPageProgess(`use-certificate-for/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('useCertificateFor', species.useCertificateFor)))
        }
    } else {
        submissionProgress.push(getPageProgess(`purpose-code/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('purposeCode', species.purposeCode)))
    }

    if (!species.purposeCode && !species.useCertificateFor) {
        return
    }

    submissionProgress.push(getPageProgess(`specimen-type/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('specimenType', species.specimenType)))

    if (!species.specimenType) {
        return
    }

    if (species.specimenType === 'animalLiving') {//Living animal flow
        if (submission.permitType !== pt.ARTICLE_10) {
            submissionProgress.push(getPageProgess(`multiple-specimens/${applicationIndex}`, applicationIndex, includePageData, getPageDataMultipleSpecimens(species)))
            if (typeof species.isMultipleSpecimens !== 'boolean') {
                return
            }
        }

        if (submission.permitType === pt.ARTICLE_10 || species.numberOfUnmarkedSpecimens === 1 || species.isMultipleSpecimens === false) {
            submissionProgress.push(getPageProgess(`has-unique-identification-mark/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('hasUniqueIdentificationMark', species.hasUniqueIdentificationMark)))

            if (species.hasUniqueIdentificationMark) {
                submissionProgress.push(getPageProgess(`unique-identification-mark/${applicationIndex}`, applicationIndex, includePageData, getPageDataUniqueIdentificationMark(species)))
                if (!species.uniqueIdentificationMarks?.length) {
                    return
                }
            }
        }

        if (species.isMultipleSpecimens && species.numberOfUnmarkedSpecimens > 1) {
            submissionProgress.push(getPageProgess(`describe-specimen/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('specimenDescriptionGeneric', species.specimenDescriptionGeneric)))
        } else {
            submissionProgress.push(getPageProgess(`describe-living-animal/${applicationIndex}`, applicationIndex, includePageData, getPageDataDescribeLivingAnimal(species)))
        }

    } else {//Not living animal flow
        submissionProgress.push(getPageProgess(`quantity/${applicationIndex}`, applicationIndex, includePageData, getPageDataQuantity(species)))

        if (!species.quantity) {
            return
        }

        if (species.specimenType === 'animalWorked' || species.specimenType === 'plantWorked') {
            submissionProgress.push(getPageProgess(`created-date/${applicationIndex}`, applicationIndex, includePageData, getPageDataCreatedDate(species?.createdDate)))
            if (!species.createdDate) {
                return
            }
        }

        submissionProgress.push(getPageProgess(`trade-term-code/${applicationIndex}`, applicationIndex, includePageData, getPageDataTradeTermCode(species)))

        if (typeof species.isTradeTermCode !== 'boolean') {
            return
        }

        submissionProgress.push(getPageProgess(`has-unique-identification-mark/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('hasUniqueIdentificationMark', species.hasUniqueIdentificationMark)))

        if (species.hasUniqueIdentificationMark) {
            submissionProgress.push(getPageProgess(`unique-identification-mark/${applicationIndex}`, applicationIndex, includePageData, getPageDataUniqueIdentificationMark(species)))

            if (!species.uniqueIdentificationMarks?.length) {
                return
            }
        }

        submissionProgress.push(getPageProgess(`describe-specimen/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('specimenDescriptionGeneric', species.specimenDescriptionGeneric)))

    }

    if (!species.specimenDescriptionGeneric && !species.sex) {
        return
    }

    if (submission.permitType === pt.ARTICLE_10) { //Article 10 flow
        if (config.enableBreederPage && application.species.specimenType === 'animalLiving') {
            submissionProgress.push(getPageProgess(`breeder/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('isBreeder', application.isBreeder)))

            if (typeof application.isBreeder !== 'boolean') {
                return
            }

            if (application.isBreeder === false) {
                submissionProgress.push(getPageProgess(`acquired-date/${applicationIndex}`, applicationIndex, includePageData, getPageDataAcquiredDate(species?.acquiredDate)))
            }
            if (!species.acquiredDate && application.isBreeder === false) {
                return
            }
        } else {
            submissionProgress.push(getPageProgess(`acquired-date/${applicationIndex}`, applicationIndex, includePageData, getPageDataAcquiredDate(species?.acquiredDate)))

            if (!species.acquiredDate) {
                return
            }
        }

        submissionProgress.push(getPageProgess(`already-have-a10/${applicationIndex}`, applicationIndex, includePageData, getPageDataA10CertificateNumber(species)))

        if (typeof species.isA10CertificateNumberKnown !== 'boolean') {
            return
        }

        submissionProgress.push(getPageProgess(`ever-imported-exported/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('isEverImportedExported', species.isEverImportedExported)))

    } else if (!(submission.permitType === pt.REEXPORT && submission.otherPermitTypeOption === pto.SEMI_COMPLETE)) {

        submissionProgress.push(getPageProgess(`importer-exporter/${applicationIndex}`, applicationIndex, includePageData, getPageDataImporterExporter(application.importerExporterDetails)))

    } else {
        //No action necessary
    }

    if ((application.importerExporterDetails && submission.permitType !== pt.EXPORT)
        || (submission.permitType === pt.REEXPORT && submission.otherPermitTypeOption === pto.SEMI_COMPLETE)
        || species.isEverImportedExported === true
    ) {
        submissionProgress.push(getPageProgess(`origin-permit-details/${applicationIndex}`, applicationIndex, includePageData, getPageDataOriginPermitDetails(application.permitDetails)))

        if (typeof application.permitDetails?.isCountryOfOriginNotKnown !== 'boolean') {
            return
        }

        if (submission.permitType === pt.IMPORT && !application.permitDetails?.isCountryOfOriginNotKnown && application.permitDetails?.countryOfOrigin) {
            submissionProgress.push(getPageProgess(`country-of-origin-import/${applicationIndex}`, applicationIndex, includePageData, getPageDataSimple('isExportOrReexportSameAsCountryOfOrigin', application.permitDetails?.isExportOrReexportSameAsCountryOfOrigin)))
            if (typeof application.permitDetails.isExportOrReexportSameAsCountryOfOrigin !== 'boolean') {
                return
            }
        }

        if (application.permitDetails.isExportOrReexportSameAsCountryOfOrigin !== true && submission.permitType !== pt.ARTICLE_10) {
            submissionProgress.push(getPageProgess(`export-permit-details/${applicationIndex}`, applicationIndex, includePageData, getPageDataExportPermitDetails(application.permitDetails)))
            if (typeof application.permitDetails.exportOrReexportPermitDetailsNotKnown !== 'boolean') {
                return
            }
        }
        if (submission.permitType !== pt.IMPORT && submission.permitType !== pt.EXPORT) {
            submissionProgress.push(getPageProgess(`import-permit-details/${applicationIndex}`, applicationIndex, includePageData, getPageDataImportPermitDetails(application.permitDetails)))
            if (typeof application.permitDetails.importPermitDetailsNotKnown !== 'boolean') {
                return
            }
        }
    }

    if ((!application.importerExporterDetails || submission.permitType !== pt.EXPORT)
        && (species.isEverImportedExported || submission.permitType !== pt.ARTICLE_10)
        && !application.permitDetails) {
        return
    }

    submissionProgress.push(getPageProgess(`additional-info/${applicationIndex}`, applicationIndex, includePageData, getPageDataAdditionalInfo(application)))

    if (submission.permitType === pt.ARTICLE_10) {
        submissionProgress.push(getPageProgess(`add-export-permit/${applicationIndex}`, applicationIndex, includePageData, getPageDataIsExportPermitRequired(application.a10ExportData?.isExportPermitRequired)))
        if (typeof application.a10ExportData?.isExportPermitRequired !== "boolean" && config.enableGenerateExportPermitsFromA10s) {
            return
        }
        if (application.a10ExportData?.isExportPermitRequired && config.enableGenerateExportPermitsFromA10s) {
            submissionProgress.push(getPageProgess(`importer-details/${applicationIndex}`, applicationIndex, includePageData, getPageDataImporterDetails(application.a10ExportData)))
            if (!application.a10ExportData?.importerDetails?.country) {
                return
            }
        }
    }

    submissionProgress.push(getPageProgess(`application-summary/view/${applicationIndex}`, applicationIndex))

    completeApplications++
    applicationStatuses[applicationIndex].status = 'complete'
}


function getPageProgess(pageUrl, applicationIndex = null, includePageData = null, pageData = null) {
    return includePageData ? { pageUrl, applicationIndex, pageData } : { pageUrl, applicationIndex }
}

function getPageDataSimple(fieldId, value) {

    let hasData = false
    if (typeof value === 'boolean') {
        hasData = true
    } else {
        hasData = Boolean(value)
    }

    return [
        {
            fieldId: fieldId,
            isMandatory: true,
            hasData
        }
    ]
}

function getPageDataContactDetails(contact) {
    return [
        {
            fieldId: 'applicant-fullName',
            isMandatory: true,
            hasData: Boolean(contact?.fullName)
        },
        {
            fieldId: 'applicant-businessName',
            isMandatory: false,
            hasData: Boolean(contact?.businessName)
        },
        {
            fieldId: 'applicant-email',
            isMandatory: false,
            hasData: Boolean(contact?.email)
        }
    ]
}

function getPageDataSourceCode(species) {
    return [
        {
            fieldId: 'sourceCode',
            isMandatory: true,
            hasData: Boolean(species?.sourceCode)
        },
        {
            fieldId: 'anotherSourceCodeForI',
            isMandatory: species?.sourceCode === 'I',
            hasData: Boolean(species?.anotherSourceCodeForI)
        },
        {
            fieldId: 'anotherSourceCodeForO',
            isMandatory: species?.sourceCode === 'O',
            hasData: Boolean(species?.anotherSourceCodeForO)
        },
        {
            fieldId: 'enterAReason',
            isMandatory: species?.sourceCode === 'U',
            hasData: Boolean(species?.enterAReason)
        }
    ]
}

function getPageDataMultipleSpecimens(species) {
    return [
        {
            fieldId: 'isMultipleSpecimens',
            isMandatory: true,
            hasData: typeof species?.isMultipleSpecimens === 'boolean'
        },
        {
            fieldId: 'numberOfSpecimens',
            isMandatory: species?.isMultipleSpecimens,
            hasData: Boolean(species?.numberOfUnmarkedSpecimens)
        }
    ]
}

function getPageDataUniqueIdentificationMark(species) {
    return [
        {
            fieldId: 'hasUniqueIdentificationMarkType',
            isMandatory: true,
            hasData: Boolean(species?.hasUniqueIdentificationMark)
        },
        {
            fieldId: 'uniqueIdentificationMarks',
            isMandatory: Boolean(species?.hasUniqueIdentificationMark),
            hasData: species?.uniqueIdentificationMarks?.length > 0
        }
    ]
}

function getPageDataDescribeLivingAnimal(species) {
    return [
        {
            fieldId: 'sex',
            isMandatory: true,
            hasData: Boolean(species.sex)
        },
        {
            fieldId: 'dateOfBirth',
            isMandatory: false,
            hasData: Boolean(species.dateOfBirth)
        },
        {
            fieldId: 'maleParentDetails',
            isMandatory: false,
            hasData: Boolean(species.maleParentDetails)
        },
        {
            fieldId: 'femaleParentDetails',
            isMandatory: false,
            hasData: Boolean(species.femaleParentDetails)
        },
        {
            fieldId: 'specimenDescriptionLivingAnimal',
            isMandatory: true,
            hasData: Boolean(species.specimenDescriptionLivingAnimal)
        }
    ]
}

function getPageDataA10CertificateNumber(species) {
    return [
        {
            fieldId: 'isA10CertificateNumberKnown',
            isMandatory: true,
            hasData: typeof species.isA10CertificateNumberKnown === 'boolean'
        },
        {
            fieldId: 'a10CertificateNumber',
            isMandatory: Boolean(species.isA10CertificateNumberKnown),
            hasData: Boolean(species.a10CertificateNumber)
        }
    ]
}

function getPageDataImporterExporter(importerExporterDetails) {
    return [
        {
            fieldId: 'importerExporter-country',
            isMandatory: true,
            hasData: Boolean(importerExporterDetails?.country)
        },
        {
            fieldId: 'importerExporter-name',
            isMandatory: true,
            hasData: Boolean(importerExporterDetails?.name)
        },
        {
            fieldId: 'importerExporter-addressLine1',
            isMandatory: true,
            hasData: Boolean(importerExporterDetails?.addressLine1)
        },
        {
            fieldId: 'importerExporter-addressLine2',
            isMandatory: true,
            hasData: Boolean(importerExporterDetails?.addressLine2)
        },
        {
            fieldId: 'importerExporter-addressLine3',
            isMandatory: false,
            hasData: Boolean(importerExporterDetails?.addressLine3)
        },
        {
            fieldId: 'importerExporter-addressLine4',
            isMandatory: false,
            hasData: Boolean(importerExporterDetails?.addressLine4)
        },
        {
            fieldId: 'importerExporter-postcode',
            isMandatory: false,
            hasData: Boolean(importerExporterDetails?.postcode)
        },
    ]
}

function getPageDataIsExportPermitRequired(isExportPermitRequired) {
    return [
        {
            fieldId: 'isExportPermitRequired',
            isMandatory: config.enableGenerateExportPermitsFromA10s,
            hasData: typeof isExportPermitRequired === 'boolean'
        }
    ]
}

function getPageDataImporterDetails(a10ExportData) {
    return [
        {
            fieldId: 'importerDetails-country',
            isMandatory: Boolean(a10ExportData?.isExportPermitRequired) && config.enableGenerateExportPermitsFromA10s,
            hasData: Boolean(a10ExportData?.importerDetails?.country)
        },
        {
            fieldId: 'importerDetails-name',
            isMandatory: Boolean(a10ExportData?.isExportPermitRequired) && config.enableGenerateExportPermitsFromA10s,
            hasData: Boolean(a10ExportData?.importerDetails?.name)
        },
        {
            fieldId: 'importerDetails-addressLine1',
            isMandatory: Boolean(a10ExportData?.isExportPermitRequired) && config.enableGenerateExportPermitsFromA10s,
            hasData: Boolean(a10ExportData?.importerDetails?.addressLine1)
        },
        {
            fieldId: 'importerDetails-addressLine2',
            isMandatory: Boolean(a10ExportData?.isExportPermitRequired) && config.enableGenerateExportPermitsFromA10s,
            hasData: Boolean(a10ExportData?.importerDetails?.addressLine2)
        },
        {
            fieldId: 'importerDetails-addressLine3',
            isMandatory: false,
            hasData: Boolean(a10ExportData?.importerDetails?.addressLine3)
        },
        {
            fieldId: 'importerDetails-addressLine4',
            isMandatory: false,
            hasData: Boolean(a10ExportData?.importerDetails?.addressLine4)
        },
        {
            fieldId: 'importerDetails-postcode',
            isMandatory: false,
            hasData: Boolean(a10ExportData?.importerDetails?.postcode)
        },
    ]
}

function getPageDataOriginPermitDetails(permitDetails) {
    const result = [
        {
            fieldId: 'countryOfOrigin',
            isMandatory: !permitDetails?.isCountryOfOriginNotKnown,
            hasData: Boolean(permitDetails?.countryOfOrigin)
        },
        {
            fieldId: 'countryOfOriginPermitNumber',
            isMandatory: !permitDetails?.isCountryOfOriginNotKnown,
            hasData: Boolean(permitDetails?.countryOfOriginPermitNumber)
        },
        {
            fieldId: 'countryOfOriginPermitIssueDate',
            isMandatory: !permitDetails?.isCountryOfOriginNotKnown,
            hasData: Boolean(permitDetails?.countryOfOriginPermitIssueDate?.year)
        },
        {
            fieldId: 'isCountryOfOriginNotKnown',
            isMandatory: true,
            hasData: typeof permitDetails?.isCountryOfOriginNotKnown === 'boolean'
        }
    ]

    return result
}

function getPageDataExportPermitDetails(permitDetails) {
    const result = [
        {
            fieldId: 'exportOrReexportCountry',
            isMandatory: !permitDetails?.exportOrReexportPermitDetailsNotKnown,
            hasData: Boolean(permitDetails?.exportOrReexportCountry)
        },
        {
            fieldId: 'exportOrReexportPermitNumber',
            isMandatory: !permitDetails?.exportOrReexportPermitDetailsNotKnown,
            hasData: Boolean(permitDetails?.exportOrReexportPermitNumber)
        },
        {
            fieldId: 'exportOrReexportPermitIssueDate',
            isMandatory: !permitDetails?.exportOrReexportPermitDetailsNotKnown,
            hasData: Boolean(permitDetails?.exportOrReexportPermitIssueDate?.year)
        },
        {
            fieldId: 'exportOrReexportPermitDetailsNotKnown',
            isMandatory: true,
            hasData: typeof permitDetails?.exportOrReexportPermitDetailsNotKnown === 'boolean'
        }
    ]

    return result
}

function getPageDataImportPermitDetails(permitDetails) {
    const result = [
        {
            fieldId: 'importPermitNumber',
            isMandatory: !permitDetails?.importPermitDetailsNotKnown,
            hasData: Boolean(permitDetails?.importPermitNumber)
        },
        {
            fieldId: 'importPermitIssueDate',
            isMandatory: !permitDetails?.importPermitDetailsNotKnown,
            hasData: Boolean(permitDetails?.importPermitIssueDate?.year)
        },
        {
            fieldId: 'importPermitDetailsNotKnown',
            isMandatory: true,
            hasData: typeof permitDetails?.importPermitDetailsNotKnown === 'boolean'
        }
    ]

    return result
}

function getPageDataQuantity(species) {
    return [
        {
            fieldId: 'quantity',
            isMandatory: true,
            hasData: Boolean(species?.quantity)
        },
        {
            fieldId: 'unitOfMeasurement',
            isMandatory: true,
            hasData: Boolean(species?.unitOfMeasurement)
        }
    ]
}

function getPageDataCreatedDate(createdDate) {
    return [
        {
            fieldId: 'createdDate-isExactDateUnknown',
            isMandatory: true,
            hasData: typeof createdDate?.isExactDateUnknown === 'boolean'
        },
        {
            fieldId: 'createdDate-approximateDate',
            isMandatory: createdDate?.isExactDateUnknown,
            hasData: Boolean(createdDate?.approximateDate)
        },
        {
            fieldId: 'createdDate-date',
            isMandatory: !createdDate?.isExactDateUnknown,
            hasData: Boolean(createdDate?.day) && Boolean(createdDate?.month) && Boolean(createdDate?.year)
        }
    ]
}

function getPageDataAcquiredDate(acquiredDate) {
    return [
        {
            fieldId: 'acquiredDate-isExactDateUnknown',
            isMandatory: true,
            hasData: typeof acquiredDate?.isExactDateUnknown === 'boolean'
        },
        {
            fieldId: 'acquiredDate-approximateDate',
            isMandatory: acquiredDate?.isExactDateUnknown,
            hasData: Boolean(acquiredDate?.approximateDate)
        },
        {
            fieldId: 'acquiredDate-date',
            isMandatory: !acquiredDate?.isExactDateUnknown,
            hasData: Boolean(acquiredDate?.day) && Boolean(acquiredDate?.month) && Boolean(acquiredDate?.year)
        }
    ]
}

function getPageDataTradeTermCode(species) {
    return [
        {
            fieldId: 'isTradeTermCode',
            isMandatory: true,
            hasData: typeof species?.isTradeTermCode === 'boolean'
        },
        {
            fieldId: 'tradeTermCode',
            isMandatory: species?.isTradeTermCode,
            hasData: Boolean(species?.tradeTermCode)
        }
    ]
}

function getPageDataAdditionalInfo(application) {
    return [
        {
            fieldId: 'comments',
            isMandatory: false,
            hasData: Boolean(application?.comments)
        },
        {
            fieldId: 'internalReference',
            isMandatory: false,
            hasData: Boolean(application?.internalReference)
        }
    ]
}

module.exports = { getSubmissionProgress }