const Joi = require("joi")
const { urlPrefix, enableDeliveryType, enableInternalReference, enableGenerateExportPermitsFromA10s } = require("../../config/config")
const { getErrorList, getFieldError, toPascalCase } = require("../lib/helper-functions")
const { getYarValue, setYarValue, sessionKey } = require('../lib/session')
const { deliveryType: dt, summaryType: summaryTypeConst } = require("../lib/constants")
const { permitType: pt, permitTypeOption: pto, getPermitDescription } = require("../lib/permit-type-helper")
const { getSubmission, mergeSubmission, validateSubmission, cloneSubmission, saveDraftSubmission, checkDraftSubmissionExists, allowPageNavigation } = require("../lib/submission")
const { setChangeRoute, clearChangeRoute, getChangeRouteData, changeTypes } = require("../lib/change-route")
const dynamics = require("../services/dynamics-service")
const textContent = require("../content/text-content")
const { config } = require("dotenv")
const pageId = "application-summary"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathAdditionalInfo = `${urlPrefix}/additional-info`
const previousPathAddExportPermit = `${urlPrefix}/add-export-permit`
const previousPathImporterDetails = `${urlPrefix}/importer-details`
const previousPathMySubmissions = `${urlPrefix}/my-submissions`
const previousPathMySubmission = `${urlPrefix}/my-submission`
const nextPathYourSubmission = `${urlPrefix}/your-submission`
const nextPathCopyAsNewApplication = `${urlPrefix}/application-summary/copy-as-new`
const draftSubmissionWarning = `${urlPrefix}/draft-submission-warning/copy-as-new`
const invalidSubmissionPath = `${urlPrefix}/`
const summaryTypes = Object.values(summaryTypeConst)
const areYouSureViewName = 'application-yes-no-layout'

const changeLink = {
  sourceCode: {
    href: '/sourceCode',
    hiddenText: 'source code'
  },
  describeLivingAnimal: {
    href: '/describeLivingAnimal'
  },
  importerDetails: {
    href: '/importerDetails'
  },
  importerExporterDetails: {
    href: '/importerExporterDetails',
    hiddenTextContactDetails: 'contact details'
  },
  contactDetails: {
    href: '/applicantContactDetails',
    hiddenText: 'contact details'
  },
  applicantAddress: {
    href: '/applicantAddress',
    hiddenText: 'applicant address'
  },
  originPermitDetails: {
    href: '/originPermitDetails',
    hiddenText: 'country of origin permit details'
  },
  exportPermitDetails: {
    href: '/exportPermitDetails',
    hiddenText: 'export permit details'
  }
}

const pageContent = textContent.applicationSummary
const commonContent = textContent.common

function createApplicationSummaryModel(errors, data) {
  const summaryType = data.summaryType

  const summaryData = {
    summaryType,
    hrefPrefix: `../../application-summary/${summaryType}/change/${data.applicationIndex}`,
    mandatoryFieldIssues: data.mandatoryFieldIssues
  }

  const appContent = lookupAppContent(data)

  const summaryListSections = []
  const isReadOnly = data.summaryType === summaryTypeConst.VIEW_SUBMITTED

  summaryListSections.push(getSummaryListAboutThePermit(summaryData, appContent))
  summaryListSections.push(getSummaryListDeliveryAddress(summaryData, data))
  summaryListSections.push(getSummaryListSpecimenDetails(summaryData, appContent, data, isReadOnly))
  summaryListSections.push(getSummaryListImporterExporterDetails(summaryData, data, isReadOnly))
  summaryListSections.push(getSummaryListContactDetails(summaryData, data))
  summaryListSections.push(getSummaryListRemarks(summaryData, data, isReadOnly))
  summaryListSections.push(getSummaryListCountryOfOriginPermitDetails(summaryData, data, isReadOnly))
  summaryListSections.push(getSummaryListExportOrReexportPermitDetails(summaryData, data, isReadOnly))
  summaryListSections.push(getSummaryListImportPermitDetails(summaryData, data, isReadOnly))
  summaryListSections.push(getSummaryListA10ExportData(summaryData, data, isReadOnly))

  const breadcrumbs = getBreadcrumbs(data, summaryType)
  const backLink = getBackLink(summaryType, data)

  summaryListSections.forEach(item => applyBorderClasses(item.value))

  let errorList = null

  if (errors?.mandatoryFieldIssues) {
    errorList = summaryListSections.flatMap(section =>
      section.value.rows
        .filter(row => row.error)
        .map(row => row.error)
    )
  }

  const summaryListSectionsObject = summaryListSections.reduce((result, current) => {
    result[current.key] = current.value
    return result
  }, {})

  let hintIncomplete = ''
  if (data.mandatoryFieldIssues.length > 0 && ![summaryTypeConst.VIEW_SUBMITTED].includes(summaryType)) {
    hintIncomplete = pageContent.hintIncomplete
  }

  const showImportPermitDetails = canShowImportPermitDetails(summaryListSectionsObject, summaryType)

  const model = {
    backLink,
    breadcrumbs: [summaryTypeConst.VIEW_SUBMITTED, summaryTypeConst.COPY_AS_NEW].includes(summaryType) ? breadcrumbs : "",
    pageHeader: appContent.pageHeader,
    //pageTitle: appContent.pageTitle + commonContent.pageTitleSuffix,
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : appContent.pageTitle + commonContent.pageTitleSuffix,
    buttonText: appContent.buttonText,
    showConfirmButton: appContent.showConfirmButton,
    formActionPage: `${currentPath}/${data.summaryType}/${data.applicationIndex}`,
    hintIncomplete,
    headerPermit: pageContent.headerPermit,
    headerContactDetails: data.isAgent ? appContent.headerApplicantContactDetails : pageContent.headerYourContactDetails,
    headerDeliveryAddress: pageContent.headerDeliveryAddress,
    headerSpecimenDetails: pageContent.headerSpecimenDetails,
    headingImporterExporterDetails: appContent.headingImporterExporterDetails,
    headerA10ExportDetails: pageContent.headerA10ExportDetails,
    showImporterExporterDetails: summaryListSectionsObject.summaryListImporterExporterDetails.rows?.length > 0,
    showOriginPermitDetails: summaryListSectionsObject.summaryListCountryOfOriginPermitDetails.rows?.length > 0,
    showExportPermitDetails: summaryListSectionsObject.summaryListExportOrReexportPermitDetails.rows?.length > 0,
    showImportPermitDetails,
    showAdditionalInfo: summaryListSectionsObject.summaryListRemarks.rows?.length > 0,
    showA10ExportDetails: summaryListSectionsObject.summaryListA10ExportData.rows?.length > 0,
    headingOriginPermitDetails: pageContent.headingOriginPermitDetails,
    headingExportPermitDetails: pageContent.headingExportPermitDetails,
    headingImportPermitDetails: pageContent.headingImportPermitDetails,
    headerAdditionalInformation: pageContent.headerAdditionalInformation,
    returnToYourApplicationsLinkText: summaryType === summaryTypeConst.VIEW_SUBMITTED ? pageContent.returnToYourApplicationsLinkText : "",
    returnToYourApplicationsLinkUrl: summaryType === summaryTypeConst.VIEW_SUBMITTED ? `${urlPrefix}/my-submissions` : "",
    ...summaryListSectionsObject,
    errorSummaryTitle: pageContent.errorSummaryTitle,
    errorList
  }
  return { ...commonContent, ...model }
}

function canShowImportPermitDetails(summaryListSectionsObject, summaryType) {
  return summaryListSectionsObject.summaryListImportPermitDetails.rows?.length > 0 && (summaryType !== summaryTypeConst.VIEW_SUBMITTED || Boolean(summaryListSectionsObject.summaryListImportPermitDetails.rows[0].value?.text))
}

function getBackLink(summaryType, data) {
  const endOfApplicationPage = getEndOfApplicationPage(data.applicationIndex, data.permitType, data.a10ExportData)
  switch (summaryType) {
    case summaryTypeConst.CHECK:
      return data.referer?.endsWith(nextPathYourSubmission) ? nextPathYourSubmission : endOfApplicationPage
    case summaryTypeConst.VIEW_SUBMITTED:
    case summaryTypeConst.COPY_AS_NEW:
      return null
    default:
      return nextPathYourSubmission
  }
}

function getEndOfApplicationPage(applicationIndex, permitType, a10ExportData) {
  //This determines which was the page before the application summary ie. the end of the application
  let endOfApplicationPage = `${previousPathAdditionalInfo}/${applicationIndex}`

  if (permitType === pt.ARTICLE_10 && enableGenerateExportPermitsFromA10s) {
    if (a10ExportData?.isExportPermitRequired) {
      endOfApplicationPage = `${previousPathImporterDetails}/${applicationIndex}`
    } else {
      endOfApplicationPage = `${previousPathAddExportPermit}/${applicationIndex}`
    }
  }
  return endOfApplicationPage
}

function getBreadcrumbs(data, summaryType, applicationRef) {
  const submissionRef = data.submissionRef || data.cloneSource?.submissionRef
  const submissionLink = `${previousPathMySubmission}/${data.cloneSource ? data.cloneSource.submissionRef : data.submissionRef}`
  const applicationLink = `${currentPath}/view-submitted/${data.cloneSource ? data.cloneSource.applicationIndex : data.applicationIndex}`
  const breadcrumbs = {
    items: [
      {
        text: pageContent.textBreadcrumbs,
        href: previousPathMySubmissions,
      }
    ]
  }

  if (submissionRef) {
    breadcrumbs.items.push({
      text: submissionRef,
      href: submissionLink
    })
  }

  if (applicationRef) {
    breadcrumbs.items.push({
      text: applicationRef,
      href: summaryType === summaryTypeConst.COPY_AS_NEW ? applicationLink : "#"
    })
  }

  if (summaryType === summaryTypeConst.COPY_AS_NEW) {
    breadcrumbs.items.push({
      text: pageContent.pageHeaderCopy,
      href: "#"
    })
  }

  return breadcrumbs
}

function createSummaryList(key, id, rows) {
  return {
    key,
    value: {
      id,
      name: id,
      classes: "govuk-!-margin-bottom-9",
      rows
    }
  }
}

function getSummaryListAboutThePermit(summaryData, appContent) {
  return createSummaryList(
    'summaryListAboutThePermit',
    'permitType',
    [createSummaryListRow(summaryData, ["permitTypeOption", "otherPermitTypeOption"], pageContent.rowTextPermitType, appContent.permitTypeValue, "/permitType", "permit type")]
  )
}


function getSummaryListDeliveryAddress(summaryData, data) {
  const summaryListDeliveryAddressRows = []

  const deliveryAddressDataItems = [
    data.delivery.address.deliveryName,
    data.delivery.address.addressLine1,
    data.delivery.address.addressLine2,
    data.delivery.address.addressLine3,
    data.delivery.address.addressLine4,
    data.delivery.address.countryDesc,
    data.delivery.address.postcode
  ].filter(Boolean)

  const deliveryAddressDataValue = deliveryAddressDataItems.join(', ')

  let deliveryTypeDataValue = ""
  if (enableDeliveryType) {
    switch (data.delivery.deliveryType) {
      case dt.SPECIAL_DELIVERY:
        deliveryTypeDataValue = pageContent.rowTextSpecialDelivery
        break
      case dt.STANDARD_DELIVERY:
        deliveryTypeDataValue = pageContent.rowTextStandardDelivery
        break
      default:
        throw new Error("Unknown delivery type: " + data.delivery.deliveryType)
    }
  }

  summaryListDeliveryAddressRows.push(createSummaryListRow(summaryData, "delivery-address", pageContent.rowTextAddress, deliveryAddressDataValue, "/deliveryAddress", "delivery address"))

  if (deliveryTypeDataValue) {
    summaryListDeliveryAddressRows.push(createSummaryListRow(summaryData, "deliveryType", pageContent.rowTextDeliveryType, deliveryTypeDataValue, "/deliveryType", "delivery type"))
  }

  return createSummaryList(
    'summaryListDeliveryAddress',
    'deliveryAddress',
    summaryListDeliveryAddressRows
  )
}

function getSummaryListSpecimenDetails(summaryData, appContent, data, isReadOnly) {
  const summaryListSpecimenDetailsRows = []

  let unitsOfMeasurementValue = null
  if (data.species.unitOfMeasurement && data.species.unitOfMeasurement === "noOfSpecimens") {
    unitsOfMeasurementValue = pageContent.rowTextUnitsOfMeasurementNoOfSpecimens
  } else if (data.species.unitOfMeasurement && data.species.unitOfMeasurement === "noOfPiecesOrParts") {
    unitsOfMeasurementValue = pageContent.rowTextUnitsOfMeasurementNoOfPiecesOrParts
  } else {
    unitsOfMeasurementValue = data.species?.unitOfMeasurement
  }

  let sexDescription = null
  if (data.species.sex) {
    switch (data.species.sex) {
      case 'M':
        sexDescription = pageContent.rowTextSexMale
        break
      case 'F':
        sexDescription = pageContent.rowTextSexFemale
        break
      case 'U':
        sexDescription = pageContent.rowTextNotKnown
        break
      default:
        break
    }
  }

  summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "speciesName", pageContent.rowTextScientificName, data.species.speciesName, "/speciesName", "species name"))

  //This is where we need to add a new entry for number of unmarked specimens

  if (allowPageNavigation(data.submissionProgress, "source-code/" + data.applicationIndex) || isReadOnly) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ["sourceCode", "enterAReason"], pageContent.rowTextSourceCode, `${data.species.sourceCode || ""} ${appContent.sourceCodeValueText[data.species.sourceCode] || ""}`, changeLink.sourceCode.href, changeLink.sourceCode.hiddenText))

    if (data.species.sourceCode === 'I') {
      summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "anotherSourceCodeForI", pageContent.rowTextOtherSourceCode, `${data.species.anotherSourceCodeForI || ""} ${appContent.otherSourceCodeValueText[data.species.anotherSourceCodeForI] || ""}`, changeLink.sourceCode.href, changeLink.sourceCode.hiddenText))
    }
    if (data.species.sourceCode === 'O') {
      summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "anotherSourceCodeForO", pageContent.rowTextOtherSourceCode, `${data.species.anotherSourceCodeForO || ""} ${appContent.otherSourceCodeValueText[data.species.anotherSourceCodeForO] || ""}`, changeLink.sourceCode.href, changeLink.sourceCode.hiddenText))
    }
  }
  //Old logic if (data.permitType !== pt.ARTICLE_10) {
  if (allowPageNavigation(data.submissionProgress, "purpose-code/" + data.applicationIndex) || (isReadOnly && data.species.purposeCode)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "purposeCode", pageContent.rowTextPurposeCode, `${data.species.purposeCode || ""} ${appContent.purposeCodeValueText[data.species.purposeCode] || ""}`, "/purposeCode", "purpose code"))
  }
  if (allowPageNavigation(data.submissionProgress, "specimen-origin/" + data.applicationIndex) || (isReadOnly && data.species.specimenOrigin)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "specimenOrigin", pageContent.rowTextA10SpecimenOrigin, appContent.a10SpecimenOriginValue[data.species.specimenOrigin], "/specimenOrigin", "specimen origin"))
  }
  if (allowPageNavigation(data.submissionProgress, "use-certificate-for/" + data.applicationIndex) || (isReadOnly && data.species.useCertificateFor)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "useCertificateFor", pageContent.rowTextA10CertificatePurpose, appContent.a10CertificatePurposeValue[data.species.useCertificateFor], "/useCertificateFor", "use certificate for"))
  }
  if (allowPageNavigation(data.submissionProgress, "specimen-type/" + data.applicationIndex) || (isReadOnly && data.species.specimenType)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "specimenType", pageContent.rowTextSpecimenType, appContent.specimenTypeValue[data.species.specimenType], "/specimenType", "specimen type"))
  }
  //Old logic if (data.species.specimenType !== "animalLiving") {
  if (allowPageNavigation(data.submissionProgress, "quantity/" + data.applicationIndex) || (isReadOnly && data.species.quantity)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "quantity", pageContent.rowTextQuantity, data.species.quantity, "/quantity", "quantity"))
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "unitOfMeasurement", pageContent.rowTextUnitOfMeasurement, unitsOfMeasurementValue, "/quantity", "unit of measurement"))
  }
  if (allowPageNavigation(data.submissionProgress, "multiple-specimens/" + data.applicationIndex) || (isReadOnly && typeof data.isMultipleSpecimens === 'boolean')) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "quantity", pageContent.rowTextQuantity, `${data.species.numberOfUnmarkedSpecimens || 1} specimen${data.species.numberOfUnmarkedSpecimens > 1 ? 's' : ''}`, "/multipleSpecimens", "multipleSpecimens"))
  }
  //Old logic if (data.species.specimenType === "animalWorked" || data.species.specimenType === "plantWorked") {
  if (allowPageNavigation(data.submissionProgress, "created-date/" + data.applicationIndex) || (isReadOnly && data.createdDate)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ['createdDate-isExactDateUnknown', 'createdDate-approximateDate', 'createdDate-date'], pageContent.rowTextCreatedDate, data.species.createdDate?.isExactDateUnknown ? data.species.createdDate?.approximateDate : getDateValue(data.species.createdDate), "/createdDate", "created date"))
  }
  if (allowPageNavigation(data.submissionProgress, "trade-term-code/" + data.applicationIndex) || (isReadOnly && data.tradeTermCode)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ["isTradeTermCode", "tradeTermCode"], pageContent.rowTextTradeTermCode, data.species.isTradeTermCode ? `${data.species.tradeTermCode || ""} ${data.species.tradeTermCodeDesc || ""}` : pageContent.rowTextNotKnown, "/tradeTermCode", "trade term code"))
  }
  if (isReadOnly && data.species.uniqueIdentificationMarkType) {//Only for viewing old applications with single unique identifiction mark
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ["uniqueIdentificationMarkType", "uniqueIdentificationMark"], pageContent.rowTextUniqueIdentificationMark, data.species.uniqueIdentificationMarkType === "unmarked" ? pageContent.rowTextSpecimenIsNotMarked : data.species.uniqueIdentificationMark, "/uniqueIdentificationMark", "unique identification mark"))
  } else if (allowPageNavigation(data.submissionProgress, "has-unique-identification-mark/" + data.applicationIndex) || (isReadOnly && typeof data.species.hasUniqueIdentificationMark === 'boolean')) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "hasUniqueIdentificationMarkType", pageContent.rowTextHasUniqueIdentificationMark, data.species.hasUniqueIdentificationMark ? commonContent.radioOptionYes : commonContent.radioOptionNo, "/hasUniqueIdentificationMark", "has unique identification mark"))
  } else {
    //Do nothing
  }
  if (data.species.hasUniqueIdentificationMark && (allowPageNavigation(data.submissionProgress, "unique-identification-mark/" + data.applicationIndex) || (isReadOnly && data.species.uniqueIdentificationMarks && data.species.hasUniqueIdentificationMark))) {
    const markCount = data.species.uniqueIdentificationMarks ? data.species.uniqueIdentificationMarks.length : 1
    for (let i = 0; i < markCount; i++) {
      let markDetails = ''
      if (data.species.uniqueIdentificationMarks?.[i]) {
        const mark = data.species.uniqueIdentificationMarks[i]
        const markTypeText = commonContent.uniqueIdentificationMarkTypes[mark.uniqueIdentificationMarkType]
        markDetails = `${markTypeText}: ${mark.uniqueIdentificationMark}`
      }
      summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ["uniqueIdentificationMarkType", "uniqueIdentificationMark", "uniqueIdentificationMarks"], i === 0 ? pageContent.rowTextUniqueIdentificationMark : '', markDetails, "/uniqueIdentificationMark", "unique identification mark"))
    }
  }
  if (allowPageNavigation(data.submissionProgress, "describe-living-animal/" + data.applicationIndex) || (isReadOnly && data.species.sex)) {

    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "sex", pageContent.rowTextSex, sexDescription, changeLink.describeLivingAnimal.href, "sex"))
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "dateOfBirth", pageContent.rowTextDateOfBirth, data.species.dateOfBirth?.isExactDateUnknown ? data.species.dateOfBirth?.approximateDate : getDateValue(data.species.dateOfBirth), changeLink.describeLivingAnimal.href, "date of birth"))

    if ([pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(data.permitType)) {
      summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "maleParentDetails", pageContent.rowTextMaleParentDetails, data.species.maleParentDetails, changeLink.describeLivingAnimal.href, "male parent details"))
      summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "femaleParentDetails", pageContent.rowTextFemaleParentDetails, data.species.femaleParentDetails, changeLink.describeLivingAnimal.href, "female parent details"))
    }
    //Old logic if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "specimenDescriptionLivingAnimal", pageContent.rowTextOtherDescription, data.species.specimenDescriptionLivingAnimal ? data.species.specimenDescriptionLivingAnimal : "", changeLink.describeLivingAnimal.href, "describe the specimen"))
  }
  //Old logic if (data.species.specimenType !== "animalLiving" || (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType === 'unmarked')) {
  if (allowPageNavigation(data.submissionProgress, "describe-specimen/" + data.applicationIndex) || (isReadOnly && data.species.specimenDescriptionGeneric)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "specimenDescriptionGeneric", pageContent.rowTextDescription, data.species.specimenDescriptionGeneric, "/descriptionGeneric", "description"))
  }
  if (allowPageNavigation(data.submissionProgress, "breeder/" + data.applicationIndex) || (isReadOnly && typeof data.isBreeder === 'boolean')) {
    let textDescription = ""
    if (typeof data.isBreeder === 'boolean') {
      textDescription = data.isBreeder ? commonContent.radioOptionYes : commonContent.radioOptionNo
    }
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, 'isBreeder', pageContent.rowTextAreYouTheBreeder, textDescription, "/breeder", "are you the breeder"))
  }
  //Old logic if (data.permitType === pt.ARTICLE_10) {
  if (allowPageNavigation(data.submissionProgress, "acquired-date/" + data.applicationIndex) || (isReadOnly && data.species.acquiredDate)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ['acquiredDate-isExactDateUnknown', 'acquiredDate-approximateDate', 'acquiredDate-date'], pageContent.rowTextAcquiredDate, data.species.acquiredDate?.isExactDateUnknown ? data.species.acquiredDate?.approximateDate : getDateValue(data.species.acquiredDate), "/acquiredDate", "acquired date"))
  }
  if (allowPageNavigation(data.submissionProgress, "already-have-a10/" + data.applicationIndex) || (isReadOnly && typeof data.species.isA10CertificateNumberKnown === 'boolean')) {
    let textDescription = ""
    if (typeof data.species.isA10CertificateNumberKnown === 'boolean') {
      if (data.species.isA10CertificateNumberKnown) {
        textDescription = data.species.a10CertificateNumber
      } else {
        textDescription = pageContent.rowTextNotKnown
      }
    }
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ['a10CertificateNumber', 'isA10CertificateNumberKnown'], pageContent.rowTextExistingArticle10Certificate, textDescription, "/a10CertificateNumber", "existing a10 certificate"))
  }

  return createSummaryList(
    'summaryListSpecimenDetails',
    'specimenDetails',
    summaryListSpecimenDetailsRows
  )
}
function getSummaryListA10ExportData(summaryData, data, isReadOnly) {
  const summaryListA10ExportDataRows = []

  const viewingOldApplication = summaryData.summaryType === summaryTypeConst.VIEW_SUBMITTED && !data.a10ExportData

  if (data.permitType === pt.ARTICLE_10 && !viewingOldApplication && enableGenerateExportPermitsFromA10s) {
    const addressDataItems = [
      data.a10ExportData?.importerDetails?.addressLine1,
      data.a10ExportData?.importerDetails?.addressLine2,
      data.a10ExportData?.importerDetails?.addressLine3,
      data.a10ExportData?.importerDetails?.addressLine4,
      data.a10ExportData?.importerDetails?.postcode
    ].filter(Boolean)

    const addressDataValue = addressDataItems.join(', ')

    let textDescription = ""
    if (data.a10ExportData?.isExportPermitRequired === true) {
      textDescription = commonContent.radioOptionYes
    } else if (data.a10ExportData?.isExportPermitRequired === false) {
      textDescription = commonContent.radioOptionNo
    } else {
      //Do nothing
    }

    if (shouldDisplayAddExportPermit(data, isReadOnly)) {
      summaryListA10ExportDataRows.push(createSummaryListRow(summaryData, 'isExportPermitRequired', pageContent.rowTextIsExportPermitRequired, textDescription, "/addExportPermit", "is export permit required"))
    }

    if (shouldDisplayImporterDetails(data, isReadOnly)) {
      summaryListA10ExportDataRows.push(createSummaryListRow(summaryData, 'importerDetails-country', pageContent.rowTextImporterCountry, data.a10ExportData?.importerDetails?.countryDesc, changeLink.importerDetails.href, "importer country"))
      summaryListA10ExportDataRows.push(createSummaryListRow(summaryData, 'importerDetails-name', pageContent.rowTextImporterName, data.a10ExportData?.importerDetails?.name, changeLink.importerDetails.href, "importer name"))
      summaryListA10ExportDataRows.push(createSummaryListRow(summaryData, ['importerDetails-addressLine1', 'importerDetails-addressLine2', 'importerDetails-addressLine3', 'importerDetails-addressLine4', 'importerDetails-postcode'], pageContent.rowTextImporterAddress, addressDataValue, changeLink.importerDetails.href, "importer address"))
    }
  }



  return createSummaryList(
    'summaryListA10ExportData',
    'importerDetail',
    summaryListA10ExportDataRows
  )
}

function shouldDisplayAddExportPermit(data, isReadOnly) {
  return allowPageNavigation(data.submissionProgress, "add-export-permit/" + data.applicationIndex) || (isReadOnly && data.a10ExportData)
}

function shouldDisplayImporterDetails(data, isReadOnly) {
  return allowPageNavigation(data.submissionProgress, "importer-details/" + data.applicationIndex) || (isReadOnly && data.a10ExportData?.importerDetails)
}

function getSummaryListImporterExporterDetails(summaryData, data, isReadOnly) {
  const summaryListImporterExporterDetailsRows = []

  const addressDataItems = [
    data.importerExporterDetails?.addressLine1,
    data.importerExporterDetails?.addressLine2,
    data.importerExporterDetails?.addressLine3,
    data.importerExporterDetails?.addressLine4,
    data.importerExporterDetails?.postcode
  ].filter(Boolean)

  const addressDataValue = addressDataItems.join(', ')

  if (allowPageNavigation(data.submissionProgress, "importer-exporter/" + data.applicationIndex) || (isReadOnly && data.importerExporterDetails)) {
    if (data.permitType !== pt.IMPORT) {
      summaryListImporterExporterDetailsRows.push(createSummaryListRow(summaryData, 'importerExporter-country', pageContent.rowTextCountry, data.importerExporterDetails?.countryDesc, changeLink.importerExporterDetails.href, "country"))
    }
    summaryListImporterExporterDetailsRows.push(createSummaryListRow(summaryData, 'importerExporter-name', pageContent.rowTextFullName, data.importerExporterDetails?.name, changeLink.importerExporterDetails.href, changeLink.importerExporterDetails.hiddenTextContactDetails))
    summaryListImporterExporterDetailsRows.push(createSummaryListRow(summaryData, ['importerExporter-addressLine1', 'importerExporter-addressLine2', 'importerExporter-addressLine3', 'importerExporter-addressLine4', 'importerExporter-postcode'], pageContent.rowTextAddress, addressDataValue, changeLink.importerExporterDetails.href, changeLink.importerExporterDetails.hiddenTextContactDetails))
  }

  return createSummaryList(
    'summaryListImporterExporterDetails',
    'importerExporterDetail',
    summaryListImporterExporterDetailsRows
  )
}

function getSummaryListRemarks(summaryData, data, isReadOnly) {
  const summaryListRemarksRows = []
  if (allowPageNavigation(data.submissionProgress, "additional-info/" + data.applicationIndex) || isReadOnly) {
    summaryListRemarksRows.push(createSummaryListRow(summaryData, "comments", pageContent.rowTextRemarks, data.comments, "/additionalInfo", "remarks"))

    if (enableInternalReference) {
      summaryListRemarksRows.push(createSummaryListRow(summaryData, "internalReference", pageContent.rowTextInternalReference, data.internalReference, "/additionalInfo", "internal reference"))
    }
  }

  return createSummaryList(
    'summaryListRemarks',
    'remarks',
    summaryListRemarksRows
  )
}

function getSummaryListContactDetails(summaryData, data) {
  const summaryListContactDetailsRows = []
  const addressDataItems = [
    data.applicant.address.addressLine1,
    data.applicant.address.addressLine2,
    data.applicant.address.addressLine3,
    data.applicant.address.addressLine4,
    data.applicant.address.countryDesc,
    data.applicant.address.postcode
  ].filter(Boolean)

  const addressDataValue = addressDataItems.join(', ')

  const contactDetailsData = {
    fullName: data.applicant.fullName,
    businessName: data.applicant.businessName,
    email: data.applicant.email
  }

  const rowTextFullName = data.isAgent ? pageContent.rowTextFullNameAgent : pageContent.rowTextFullName
  summaryListContactDetailsRows.push(createSummaryListRow(summaryData, 'applicant-fullName', rowTextFullName, contactDetailsData.fullName, changeLink.contactDetails.href, changeLink.contactDetails.hiddenText))
  if (!data.isAgent) {
    summaryListContactDetailsRows.push(createSummaryListRow(summaryData, 'applicant-businessName', pageContent.rowTextBusinessName, contactDetailsData.businessName, changeLink.contactDetails.href, changeLink.contactDetails.hiddenText))
  }
  summaryListContactDetailsRows.push(createSummaryListRow(summaryData, 'applicant-email', pageContent.rowTextEmailAddress, contactDetailsData.email, changeLink.contactDetails.href, changeLink.contactDetails.hiddenText))
  summaryListContactDetailsRows.push(createSummaryListRow(summaryData, 'applicant-address', pageContent.rowTextAddress, addressDataValue, changeLink.applicantAddress.href, changeLink.applicantAddress.hiddenText))

  return createSummaryList(
    'summaryListApplicantContactDetails',
    'contactDetails',
    summaryListContactDetailsRows
  )
}

function getSummaryListCountryOfOriginPermitDetails(summaryData, data, isReadOnly) {
  const summaryListPermitDetailsCountryOfOriginRows = []

  const permitIssueDate = {
    day: data.permitDetails?.countryOfOriginPermitIssueDate?.day,
    month: data.permitDetails?.countryOfOriginPermitIssueDate?.month,
    year: data.permitDetails?.countryOfOriginPermitIssueDate?.year
  }


  let countryOfOriginText = toPascalCase(data.permitDetails?.countryOfOriginDesc)
  let countryOfOriginPermitNumberText = data.permitDetails?.countryOfOriginPermitNumber
  let countryOfOriginPermitIssueDateText = getDateValue(permitIssueDate)

  if (data.permitDetails?.isCountryOfOriginNotApplicable) {
    countryOfOriginText = pageContent.rowTextNotApplicable
    countryOfOriginPermitNumberText = pageContent.rowTextNotApplicable
    countryOfOriginPermitIssueDateText = pageContent.rowTextNotApplicable
  }

  if (data.permitDetails?.isCountryOfOriginNotKnown) {
    countryOfOriginText = pageContent.rowTextNotKnown
    countryOfOriginPermitNumberText = pageContent.rowTextNotKnown
    countryOfOriginPermitIssueDateText = pageContent.rowTextNotKnown
  }

  if (allowPageNavigation(data.submissionProgress, "origin-permit-details/" + data.applicationIndex) || (isReadOnly && countryOfOriginText)) {
    summaryListPermitDetailsCountryOfOriginRows.push(createSummaryListRow(summaryData, 'countryOfOrigin', pageContent.rowTextCountry, countryOfOriginText, changeLink.originPermitDetails.href, changeLink.originPermitDetails.hiddenText))
    summaryListPermitDetailsCountryOfOriginRows.push(createSummaryListRow(summaryData, 'countryOfOriginPermitNumber', pageContent.rowTextPermitNumber, countryOfOriginPermitNumberText, changeLink.originPermitDetails.href, changeLink.originPermitDetails.hiddenText))
    summaryListPermitDetailsCountryOfOriginRows.push(createSummaryListRow(summaryData, 'countryOfOriginPermitIssueDate', pageContent.rowTextPermitIssueDate, countryOfOriginPermitIssueDateText, changeLink.originPermitDetails.href, changeLink.originPermitDetails.hiddenText))
    if (data.permitType === pt.IMPORT && typeof data.permitDetails?.isExportOrReexportSameAsCountryOfOrigin === 'boolean' && !data.permitDetails?.isCountryOfOriginNotKnown) {
      const isExportOrReexportSameAsCountryOfOrigin = pageContent.rowTextIsExportOrReexportSameAsCountryOfOrigin.replace('##COUNTRY##', toPascalCase(countryOfOriginText))
      summaryListPermitDetailsCountryOfOriginRows.push(createSummaryListRow(summaryData, 'isExportOrReexportSameAsCountryOfOrigin', isExportOrReexportSameAsCountryOfOrigin, data.permitDetails?.isExportOrReexportSameAsCountryOfOrigin ? commonContent.radioOptionYes : commonContent.radioOptionNo, "/countryOfOriginImport", "country of origin import"))
    }
  }

  return createSummaryList(
    'summaryListCountryOfOriginPermitDetails',
    'permitDetails',
    summaryListPermitDetailsCountryOfOriginRows
  )
}

function getSummaryListExportOrReexportPermitDetails(summaryData, data, isReadOnly) {

  const summaryListPermitDetailsExportOrReexportRows = []

  const permitIssueDate = {
    day: data.permitDetails?.exportOrReexportPermitIssueDate?.day,
    month: data.permitDetails?.exportOrReexportPermitIssueDate?.month,
    year: data.permitDetails?.exportOrReexportPermitIssueDate?.year
  }

  let exportOrReexportCountryText = toPascalCase(data.permitDetails?.exportOrReexportCountryDesc)
  let exportOrReexportPermitNumberText = data.permitDetails?.exportOrReexportPermitNumber
  let exportOrReexportPermitIssueDateText = getDateValue(permitIssueDate)

  if (data.permitDetails?.isExportOrReexportNotApplicable) { //This is for viewing historic applications data correctly
    exportOrReexportCountryText = pageContent.rowTextNotApplicable
    exportOrReexportPermitNumberText = pageContent.rowTextNotApplicable
    exportOrReexportPermitIssueDateText = pageContent.rowTextNotApplicable
  }

  if (data.permitDetails?.exportOrReexportPermitDetailsNotKnown) {
    exportOrReexportCountryText = pageContent.rowTextNotKnown
    exportOrReexportPermitNumberText = pageContent.rowTextNotKnown
    exportOrReexportPermitIssueDateText = pageContent.rowTextNotKnown
  }

  if (data.permitDetails?.isExportOrReexportSameAsCountryOfOrigin) {
    exportOrReexportCountryText = pageContent.rowTextSameAsCountryOfOrigin
    exportOrReexportPermitNumberText = pageContent.rowTextSameAsCountryOfOrigin
    exportOrReexportPermitIssueDateText = pageContent.rowTextSameAsCountryOfOrigin
  }

  const sameAsCountryOfOriginShownInOriginPermitDetails = data.permitType === pt.IMPORT && data.permitDetails?.isExportOrReexportSameAsCountryOfOrigin && !data.permitDetails?.isCountryOfOriginNotKnown

  if (allowPageNavigation(data.submissionProgress, "export-permit-details/" + data.applicationIndex) || (isReadOnly && exportOrReexportCountryText && !sameAsCountryOfOriginShownInOriginPermitDetails)) {
    summaryListPermitDetailsExportOrReexportRows.push(createSummaryListRow(summaryData, 'exportOrReexportCountry', pageContent.rowTextCountry, exportOrReexportCountryText, changeLink.exportPermitDetails.href, changeLink.exportPermitDetails.hiddenText))
    summaryListPermitDetailsExportOrReexportRows.push(createSummaryListRow(summaryData, 'exportOrReexportPermitNumber', pageContent.rowTextPermitNumber, exportOrReexportPermitNumberText, changeLink.exportPermitDetails.href, changeLink.exportPermitDetails.hiddenText))
    summaryListPermitDetailsExportOrReexportRows.push(createSummaryListRow(summaryData, 'exportOrReexportPermitIssueDate', pageContent.rowTextPermitIssueDate, exportOrReexportPermitIssueDateText, changeLink.exportPermitDetails.href, changeLink.exportPermitDetails.hiddenText))
  }
  return createSummaryList(
    'summaryListExportOrReexportPermitDetails',
    'permitDetails',
    summaryListPermitDetailsExportOrReexportRows
  )
}

function getSummaryListImportPermitDetails(summaryData, data, isReadOnly) {
  const summaryListPermitDetailsImportRows = []

  const permitIssueDate = {
    day: data.permitDetails?.importPermitIssueDate?.day,
    month: data.permitDetails?.importPermitIssueDate?.month,
    year: data.permitDetails?.importPermitIssueDate?.year
  }


  let importText = data.permitDetails?.importDesc
  let importPermitNumberText = data.permitDetails?.importPermitNumber
  let importPermitIssueDateText = getDateValue(permitIssueDate)

  if (data.permitDetails?.importPermitDetailsNotKnown) {
    importText = pageContent.rowTextNotKnown
    importPermitNumberText = pageContent.rowTextNotKnown
    importPermitIssueDateText = pageContent.rowTextNotKnown
  }

  if (allowPageNavigation(data.submissionProgress, "import-permit-details/" + data.applicationIndex) || (isReadOnly && importText)) {
    summaryListPermitDetailsImportRows.push(createSummaryListRow(summaryData, 'importPermitNumber', pageContent.rowTextPermitNumber, importPermitNumberText, "/importPermitDetails", "import permit details"))
    summaryListPermitDetailsImportRows.push(createSummaryListRow(summaryData, 'importPermitIssueDate', pageContent.rowTextPermitIssueDate, importPermitIssueDateText, "/importPermitDetails", "import permit details"))
  }

  return createSummaryList(
    'summaryListImportPermitDetails',
    'permitDetails',
    summaryListPermitDetailsImportRows
  )
}

function applyBorderClasses(summaryList) {
  if (summaryList && summaryList.rows.length > 0) {

    summaryList.rows.forEach(item => item.classes = "")

    summaryList.rows[0].classes += 'border-top '

    summaryList.rows.forEach((item, index) => {
      if (index < summaryList.rows.length - 1) { //All items except the last one
        item.classes += 'govuk-summary-list__row--no-border'
      }
    })
  }
  return summaryList
}

function checkMandatoryFields(submissionProgress, applicationIndex) {

  return submissionProgress.filter(page => page.pageData && (page.applicationIndex === null || page.applicationIndex === applicationIndex))
    .flatMap(page => page.pageData)
    .map(field => {
      if (field.isMandatory && !field.hasData) {
        return field.fieldId
      } else {
        return null
      }
    })
    .filter(field => field !== null)

}

function createSummaryListRow(summaryData, fieldIds, label, value, href, hiddenText) {
  let actions = null
  let error = null

  const fieldIdArray = Array.isArray(fieldIds) ? fieldIds : [fieldIds]

  if (href && summaryData.summaryType !== summaryTypeConst.VIEW && summaryData.summaryType !== summaryTypeConst.VIEW_SUBMITTED) {
    const actionItems = []
    if (summaryData.mandatoryFieldIssues.some(issue => fieldIdArray.includes(issue))) {
      actionItems.push({
        html: `<strong id=${fieldIdArray[0]} class="red-background govuk-tag">${pageContent.tagIncompleteText}</strong>`
      })
      error = {
        text: label,
        href: `#${fieldIdArray[0]}`
      }
    }

    actionItems.push({
      href: summaryData.hrefPrefix + href,
      text: pageContent.changeLinkText,
      visuallyHiddenText: hiddenText
    })

    actions = {
      items: actionItems,
      classes: 'extra-wide'
    }
  }

  const summaryListRow = {
    key: {
      text: label
    },
    value: {
      text: value
    },
    actions,
    error
  }

  return summaryListRow
}

function getDateValue(date) {
  if (!date?.month || !date?.year) {
    return ''
  }
  const day = date.day?.toString().padStart(2, '0')
  const month = date.month.toString().padStart(2, '0')
  if (date.day) {
    return `${day} ${month} ${date.year}`
  } else {
    return `${month} ${date.year}`
  }
}

function getPermitSpecificContent(permitType) {
  let headerApplicantContactDetails = null
  let headingImporterExporterDetails = null
  switch (permitType) {
    case pt.IMPORT:
      headerApplicantContactDetails = pageContent.headerImporterContactDetails
      headingImporterExporterDetails = pageContent.headerExportOrReexporterContactDetails
      break
    case pt.EXPORT:
      headerApplicantContactDetails = pageContent.headerExporterContactDetails
      headingImporterExporterDetails = pageContent.headerImporterContactDetails
      break
    case pt.MIC:
    case pt.TEC:
    case pt.POC:
    case pt.REEXPORT:
      headerApplicantContactDetails = pageContent.headerReexporterContactDetails
      headingImporterExporterDetails = pageContent.headerImporterContactDetails
      break
    case pt.ARTICLE_10:
      headerApplicantContactDetails = pageContent.headerArticle10ContactDetails
      break
    default:
      throw new Error(`Invalid permit type: ${permitType}`)
  }
  return { headerApplicantContactDetails, headingImporterExporterDetails }
}

function lookupAppContent(data) {
  const { pageTitle, pageHeader, buttonText, showConfirmButton } = getSummaryTypeSpecificContent(data)
  const permitTypeValue = getPermitDescription(data.permitType, data.permitSubType)

  const { headerApplicantContactDetails, headingImporterExporterDetails } = getPermitSpecificContent(data.permitType)

  const purposeCodeValueText = getPurposeCodeValueText()
  const sourceCodeValueText = getSourceCodeValueText(data.species?.kingdom, data.species?.enterAReason)
  const otherSourceCodeValueText = getOtherSourceCodeValueText(data.species?.kingdom)

  const specimenTypeValue = {
    animalLiving: pageContent.rowTextSpecimenTypeAnimalLiving,
    animalPart: pageContent.rowTextSpecimenTypeAnimalPart,
    animalWorked: pageContent.rowTextSpecimenTypeAnimalWorked,
    animalCoral: pageContent.rowTextSpecimenTypeAnimalCoral,
    plantLiving: pageContent.rowTextSpecimenTypePlantLiving,
    plantProduct: pageContent.rowTextSpecimenTypePlantProduct,
    plantWorked: pageContent.rowTextSpecimenTypePlantWorked,
  }

  const a10SpecimenOriginValue = {
    a: pageContent.rowTextSpecimenOriginA,
    b: pageContent.rowTextSpecimenOriginB,
    c: pageContent.rowTextSpecimenOriginC,
    d: pageContent.rowTextSpecimenOriginD,
    e: pageContent.rowTextSpecimenOriginE,
    f: pageContent.rowTextSpecimenOriginF,
    g: pageContent.rowTextSpecimenOriginG
  }

  const a10CertificatePurposeValue = {
    legallyAcquired: pageContent.rowTextLegallyAcquired,
    commercialActivities: pageContent.rowTextCommercialActivities,
    moveALiveSpecimen: pageContent.rowTextMoveALiveSpecimen,
    nonDetrimentalPurposes: pageContent.rowTextNonDetrimentalPurposes,
    displayWithoutSale: pageContent.rowTextDisplayWithoutSale
  }

  return {
    pageTitle,
    pageHeader,
    buttonText,
    showConfirmButton,
    headerApplicantContactDetails,
    headingImporterExporterDetails,
    permitTypeValue,
    purposeCodeValueText,
    sourceCodeValueText,
    otherSourceCodeValueText,
    specimenTypeValue,
    a10SpecimenOriginValue,
    a10CertificatePurposeValue
  }
}

function getPurposeCodeValueText() {

  return {
    B: pageContent.rowTextPurposeCodeB,
    E: pageContent.rowTextPurposeCodeE,
    G: pageContent.rowTextPurposeCodeG,
    H: pageContent.rowTextPurposeCodeH,
    L: pageContent.rowTextPurposeCodeL,
    M: pageContent.rowTextPurposeCodeM,
    N: pageContent.rowTextPurposeCodeN,
    P: pageContent.rowTextPurposeCodeP,
    Q: pageContent.rowTextPurposeCodeQ,
    S: pageContent.rowTextPurposeCodeS,
    T: pageContent.rowTextPurposeCodeT,
    Z: pageContent.rowTextPurposeCodeZ
  }
}

function getSourceCodeValueText(kingdom, enterAReason) {
  return {
    W: pageContent.rowTextSourceCodeW,
    R: pageContent.rowTextSourceCodeR,
    D: kingdom === "Animalia" ? pageContent.rowTextSourceCodeDAnimal : pageContent.rowTextSourceCodeDPlant,
    C: pageContent.rowTextSourceCodeC,
    F: pageContent.rowTextSourceCodeF,
    I: pageContent.rowTextSourceCodeI,
    O: pageContent.rowTextSourceCodeO,
    X: pageContent.rowTextSourceCodeX,
    Y: pageContent.rowTextSourceCodeY,
    A: pageContent.rowTextSourceCodeA,
    U: enterAReason
  }
}

function getOtherSourceCodeValueText(kingdom) {
  return {
    W: pageContent.rowTextSourceCodeW,
    R: pageContent.rowTextSourceCodeR,
    D: kingdom === "Animalia" ? pageContent.rowTextSourceCodeDAnimal : pageContent.rowTextSourceCodeDPlant,
    C: pageContent.rowTextSourceCodeC,
    F: pageContent.rowTextSourceCodeF,
    A: pageContent.rowTextSourceCodeA,
    X: pageContent.rowTextSourceCodeX,
    Y: pageContent.rowTextSourceCodeY,
    U: pageContent.rowTextSourceCodeU
  }
}

function getSummaryTypeSpecificContent(data) {

  let pageTitle = null
  let pageHeader = null
  let buttonText = null
  let showConfirmButton = true


  switch (data.summaryType) {
    case summaryTypeConst.CHECK:
      pageTitle = pageContent.defaultTitleCheck
      pageHeader = pageContent.pageHeaderCheck
      buttonText = commonContent.confirmAndContinueButton
      break
    case summaryTypeConst.COPY:
    case summaryTypeConst.COPY_AS_NEW:
      pageTitle = pageContent.defaultTitleCopy
      pageHeader = pageContent.pageHeaderCopy
      buttonText = commonContent.confirmAndContinueButton
      break
    case summaryTypeConst.VIEW:
      pageTitle = pageContent.defaultTitleView
      pageHeader = pageContent.pageHeaderView
      buttonText = commonContent.returnYourApplicationsButton
      break
    case summaryTypeConst.VIEW_SUBMITTED:
      pageTitle = data.applicationRef
      pageHeader = data.applicationRef
      buttonText = commonContent.copyAsNewApplicationButton
      showConfirmButton = data.isCurrentUsersApplication
      break
    default:
      throw new Error(`Invalid summary type: ${data.summaryType}`)
  }
  return { pageTitle, pageHeader, buttonText, showConfirmButton }
}

function createAreYouSureModel(errors, data) {
  //const commonContent = textContent.common

  const pageContentAreYouSure = getPageContentAreYouSure(data)
  const errorList = getErrorList(errors, { ...commonContent.errorMessages, ...pageContentAreYouSure.errorMessages }, ['areYouSure'])

  const model = {
    backLink: `${currentPath}/${data.summaryType}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/are-you-sure/${data.summaryType}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text + commonContent.pageTitleSuffix : pageContentAreYouSure.defaultTitle + commonContent.pageTitleSuffix,
    pageHeader: pageContentAreYouSure.pageHeader,
    pageBody: pageContentAreYouSure.pageBody2 ? `${pageContentAreYouSure.pageBody1} ${data.permitType} ${pageContentAreYouSure.pageBody2}` : pageContentAreYouSure.pageBody1,
    continueWithoutSaveButton: true,
    inputName: "areYouSure",
    inputClasses: "govuk-radios--inline",
    errorMessage: getFieldError(errorList, "#areYouSure")    
  }
  return { ...commonContent, ...model }
}

function getPageContentAreYouSure(data) {
  const changeType = data.changeRouteData.changeType
  const areYouSureText = textContent.applicationSummary.areYouSure

  let pageContentAreYouSure = null
  if (changeType === "permitType") {
    pageContentAreYouSure = areYouSureText.permitType
  } else if (changeType === "speciesName") {
    pageContentAreYouSure = areYouSureText.scientificName
  } else if (changeType === "multipleSpecimens") {
    pageContentAreYouSure = areYouSureText.multipleSpecimens
  } else if (changeType === "deliveryAddress") {
    pageContentAreYouSure = areYouSureText.deliveryAddress
  } else if (!data.isAgent) {
    if (changeType === "applicantContactDetails") {
      pageContentAreYouSure = areYouSureText.yourContactDetails
    } else if (changeType === "applicantAddress") {
      pageContentAreYouSure = areYouSureText.yourAddress
    } else {
      //Do nothing
    }
  } else if (data.isAgent) {
    if (changeType === "applicantContactDetails") {
      pageContentAreYouSure = getPageContentApplicantContactDetails(data.permitType, areYouSureText)
    } else if (changeType === "applicantAddress") {
      pageContentAreYouSure = getPageContentApplicantAddress(data.permitType, areYouSureText)
    } else {
      //Do nothing
    }
  } else {
    //Do nothing
  }
  return pageContentAreYouSure
}

function getPageContentApplicantContactDetails(permitType, areYouSureText) {
  switch (permitType) {
    case pt.IMPORT:
      return areYouSureText.importerContactDetails
    case pt.EXPORT:
      return areYouSureText.exporterContactDetails
    case pt.MIC:
    case pt.TEC:
    case pt.POC:
    case pt.REEXPORT:
      return areYouSureText.reexporterContactDetails
    case pt.ARTICLE_10:
      return areYouSureText.article10ContactDetails
    default:
      throw new Error(`Unknown permit type ${permitType}`)
  }
}

function getPageContentApplicantAddress(permitType, areYouSureText) {
  switch (permitType) {
    case pt.IMPORT:
      return areYouSureText.importerAddress
    case pt.EXPORT:
      return areYouSureText.exporterAddress
    case pt.MIC:
    case pt.TEC:
    case pt.POC:
    case pt.REEXPORT:
      return areYouSureText.reexporterAddress
    case pt.ARTICLE_10:
      return areYouSureText.article10Address
    default:
      throw new Error(`Unknown permit type ${permitType}`)
  }
}

function postFailAction(request, h, err) {
  const { summaryType, applicationIndex } = request.params
  const submission = getSubmission(request)
  const { submissionProgress } = validateSubmission(submission, `${pageId}/${summaryType}/${applicationIndex}`, true)

  const pageData = {
    referer: request.headers.referer,
    summaryType: summaryType,
    applicationIndex: applicationIndex,
    permitType: submission.permitType,
    otherPermitTypeOption: submission.otherPermitTypeOption,
    permitSubType: submission.applications[applicationIndex].permitSubType,
    isAgent: submission.isAgent,
    applicant: submission.applicant,
    delivery: submission.delivery,
    applicationRef: submission.applications[applicationIndex].applicationRef,
    species: submission.applications[applicationIndex].species,
    importerExporterDetails: submission.applications[applicationIndex]?.importerExporterDetails,
    permitDetails: submission.applications[applicationIndex].permitDetails,
    comments: submission.applications[applicationIndex].comments,
    isCurrentUsersApplication: submission.contactId === request.auth.credentials.contactId,
    isBreeder: submission.applications[applicationIndex].isBreeder,
    a10ExportData: submission.applications[applicationIndex].a10ExportData,
    submissionProgress
  }

  if (err.mandatoryFieldIssues) {
    pageData.mandatoryFieldIssues = err.mandatoryFieldIssues
  }

  return h.view(pageId, createApplicationSummaryModel(err, pageData)).takeover()
}

module.exports = [
  //GET for Application Summary page
  {
    method: "GET",
    path: `${currentPath}/{summaryType}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          summaryType: Joi.string().valid(...summaryTypes),
          applicationIndex: Joi.number().required(),
        }),
        failAction: (_request, _h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { summaryType, applicationIndex } = request.params
      let submission = getSubmission(request)

      let cloneSource = null
      if (summaryType === summaryTypeConst.COPY_AS_NEW || (!submission.submissionRef && summaryType === summaryTypeConst.VIEW_SUBMITTED)) {
        cloneSource = getYarValue(request, sessionKey.CLONE_SOURCE)
      }

      if (cloneSource?.submissionRef && summaryType === summaryTypeConst.VIEW_SUBMITTED) {
        //When coming back from the copy-as-new page, load the source back in from dynamics instead of the clone
        const { user: { organisationId } } = getYarValue(request, 'CIDMAuth')
        submission = await dynamics.getSubmission(request.server, request.auth.credentials.contactId, organisationId, cloneSource?.submissionRef)
        setYarValue(request, sessionKey.SUBMISSION, submission)
        setYarValue(request, sessionKey.CLONE_SOURCE, null)
      }


      let submissionProgress

      try {
        submissionProgress = validateSubmission(submission, `${pageId}/${summaryType}/${applicationIndex}`, true).submissionProgress
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const mandatoryFieldIssues = checkMandatoryFields(submissionProgress, applicationIndex)
      clearChangeRoute(request)

      const pageData = {
        referer: request.headers.referer,
        summaryType: summaryType,
        applicationIndex: applicationIndex,
        cloneSource,
        submissionRef: submission.submissionRef,
        permitType: submission.permitType,
        otherPermitTypeOption: submission.otherPermitTypeOption,
        permitSubType: submission.applications[applicationIndex].permitSubType,
        isAgent: submission.isAgent,
        applicant: submission.applicant,
        delivery: submission.delivery,
        applicationRef: submission.applications[applicationIndex].applicationRef,
        species: submission.applications[applicationIndex].species,
        importerExporterDetails: submission.applications[applicationIndex]?.importerExporterDetails,
        permitDetails: submission.applications[applicationIndex].permitDetails,
        comments: submission.applications[applicationIndex].comments,
        internalReference: submission.applications[applicationIndex].internalReference,
        isCurrentUsersApplication: submission.contactId === request.auth.credentials.contactId,
        isBreeder: submission.applications[applicationIndex].isBreeder,
        a10ExportData: submission.applications[applicationIndex].a10ExportData,
        mandatoryFieldIssues,
        submissionProgress
      }
      return h.view(pageId, createApplicationSummaryModel(null, pageData))
    }
  },
  //GET for change links
  {
    method: "GET",
    path: `${currentPath}/{summaryType}/change/{applicationIndex}/{changeType}`,
    options: {
      validate: {
        params: Joi.object({
          summaryType: Joi.string().valid(...summaryTypes),
          applicationIndex: Joi.number().required(),
          changeType: Joi.string().valid(...changeTypes),
        }),
        failAction: (_request, _h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { applicationIndex, changeType, summaryType } = request.params
      const submission = getSubmission(request)
      const returnUrl = `${currentPath}/${summaryType}/${applicationIndex}`
      const changeRouteData = setChangeRoute(request, changeType, applicationIndex, returnUrl, submission.permitTypeOption)

      if (changeRouteData.showConfirmationPage) {
        return h.redirect(`${currentPath}/are-you-sure/${summaryType}/${applicationIndex}`)
      } else {
        return h.redirect(changeRouteData.startUrls[0].url)
      }
    }
  },
  //GET for Are You Sure page
  {
    method: "GET",
    path: `${currentPath}/are-you-sure/{summaryType}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          summaryType: Joi.string().valid(...summaryTypes),
          applicationIndex: Joi.number().required()
        })
      }
    },
    handler: async (request, h) => {
      const { applicationIndex, summaryType } = request.params
      const submission = getSubmission(request)
      const changeRouteData = getChangeRouteData(request)

      try {
        validateSubmission(submission, `${pageId}/are-you-sure/${summaryType}/${applicationIndex}`, true)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      const pageData = {
        summaryType: summaryType,
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        isAgent: submission.isAgent,
        changeRouteData: changeRouteData,
      }
      return h.view(areYouSureViewName, createAreYouSureModel(null, pageData))
    }
  },
  //POST for Application Summary Page
  {
    method: "POST",
    path: `${currentPath}/{summaryType}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          summaryType: Joi.string().valid(...summaryTypes),
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        failAction: postFailAction
      },
      handler: async (request, h) => {
        const { summaryType, applicationIndex } = request.params
        const submission = getSubmission(request)

        const { submissionProgress } = validateSubmission(submission, null, true)

        if (summaryType === summaryTypeConst.VIEW_SUBMITTED) {
          const draftSubmissionExists = await checkDraftSubmissionExists(request)
          if (draftSubmissionExists) {
            return h.redirect(`${draftSubmissionWarning}/${applicationIndex}`)
          }
          try {
            cloneSubmission(request, applicationIndex)
          } catch (err) {
            console.error(err)
            return h.redirect(invalidSubmissionPath)
          }
          saveDraftSubmission(request, `${nextPathCopyAsNewApplication}/0`)
          return h.redirect(`${nextPathCopyAsNewApplication}/0`)
        } else {
          const mandatoryFieldIssues = checkMandatoryFields(submissionProgress, applicationIndex)

          if (mandatoryFieldIssues.length > 0) {
            const error = {
              details: [
                {
                  path: ['incompleteFields'],
                  type: 'any.incompleteFields',
                  context: { label: 'applicationSummary', key: 'applicationSummary' }
                }
              ],
              mandatoryFieldIssues
            }
            return postFailAction(request, h, error)
          }
          saveDraftSubmission(request, nextPathYourSubmission)
          return h.redirect(nextPathYourSubmission)
        }

      }
    }
  },
  //POST for Are You Sure Page
  {
    method: "POST",
    path: `${currentPath}/are-you-sure/{summaryType}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          summaryType: Joi.string().valid(...summaryTypes),
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        payload: Joi.object({
          areYouSure: Joi.boolean().required()
        }),

        failAction: (request, h, err) => {
          const { applicationIndex, summaryType } = request.params
          const submission = getSubmission(request)
          const changeRouteData = getChangeRouteData(request)

          const pageData = {
            summaryType: summaryType,
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            isAgent: submission.isAgent,
            changeRouteData: changeRouteData,
          }

          return h.view(areYouSureViewName, createAreYouSureModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex, summaryType } = request.params
        const changeRouteData = getChangeRouteData(request)

        if (request.payload.areYouSure) {
          return h.redirect(changeRouteData.startUrls[0].url)
        } else {
          return h.redirect(`${currentPath}/${summaryType}/${applicationIndex}`)
        }
      }
    }
  }
]

