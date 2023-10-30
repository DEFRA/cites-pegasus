const Joi = require("joi")
const { urlPrefix, enableDeliveryType, enableInternalReference } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { permitType: pt } = require('../lib/constants')
const { getYarValue, setYarValue } = require('../lib/session')
const { deliveryType: dt } = require("../lib/constants")
const { getSubmission, mergeSubmission, validateSubmission, cloneSubmission, saveDraftSubmission, checkDraftSubmissionExists } = require("../lib/submission")
const { setChangeRoute, clearChangeRoute, getChangeRouteData, changeTypes } = require("../lib/change-route")
const dynamics = require("../services/dynamics-service")
const textContent = require("../content/text-content")
const { config } = require("dotenv")
const pageId = "application-summary"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathAdditionalInfo = `${urlPrefix}/additional-info`
const previousPathMySubmissions = `${urlPrefix}/my-submissions`
const previousPathMySubmission = `${urlPrefix}/my-submission`
const nextPathYourSubmission = `${urlPrefix}/your-submission`
const nextPathAddApplication = `${urlPrefix}/add-application`
const nextPathCopyAsNewApplication = `${urlPrefix}/application-summary/copy-as-new`
const draftSubmissionWarning = `${urlPrefix}/draft-submission-warning/copy-as-new`
const invalidSubmissionPath = `${urlPrefix}/`
const summaryTypes = ['check', 'view', 'copy', 'view-submitted', 'copy-as-new']

let changeLinkText

function createApplicationSummaryModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.applicationSummary
  const summaryType = data.summaryType
  const submissionRef = data.submissionRef || data.cloneSource?.submissionRef
  const applicationRef = data.cloneSource ? data.cloneSource.applicationRef : data.applicationRef
  const hrefPrefix = `../../application-summary/${summaryType}/change/${data.applicationIndex}`

  changeLinkText = pageContent.changeLinkText

  let pageTitle = null
  let pageHeader = null
  let buttonText = null
  let showButton = true

  switch (summaryType) {
    case "check":
      pageTitle = pageContent.defaultTitleCheck
      pageHeader = pageContent.pageHeaderCheck
      buttonText = commonContent.confirmAndContinueButton
      break
    case "copy":
    case "copy-as-new":
      pageTitle = pageContent.defaultTitleCopy
      pageHeader = pageContent.pageHeaderCopy
      buttonText = commonContent.confirmAndContinueButton
      break
    case "view":
      pageTitle = pageContent.defaultTitleView
      pageHeader = pageContent.pageHeaderView
      buttonText = commonContent.returnYourApplicationsButton
      break
    case "view-submitted":
      pageTitle = applicationRef
      pageHeader = applicationRef
      buttonText = commonContent.copyAsNewApplicationButton
      showButton = data.isCurrentUsersApplication
      break
  }

  let headerApplicantContactDetails = null
  let headingImporterExporterDetails = null
  let headingPermitDetails = null
  let permitTypeValue = null
  switch (data.permitType) {
    case "import":
      headerApplicantContactDetails = pageContent.headerImporterContactDetails
      headingImporterExporterDetails = pageContent.headerExportOrReexporterContactDetails
      headingPermitDetails = pageContent.headerExportOrReexportPermitDetails
      permitTypeValue = commonContent.permitTypeDescriptionImport
      break
    case "export":
      headerApplicantContactDetails = pageContent.headerExporterContactDetails
      headingImporterExporterDetails = pageContent.headerImporterContactDetails
      permitTypeValue = commonContent.permitTypeDescriptionExport
      break
    case "reexport":
      headerApplicantContactDetails = pageContent.headerReexporterContactDetails
      headingImporterExporterDetails = pageContent.headerImporterContactDetails
      headingPermitDetails = pageContent.headerPermitDetailsFromExportIntoGreatBritain
      permitTypeValue = commonContent.permitTypeDescriptionReexport
      break
    case "article10":
      headerApplicantContactDetails = pageContent.headerArticle10ContactDetails
      headingPermitDetails = pageContent.headerPermitDetailsFromExportIntoGreatBritain
      permitTypeValue = commonContent.permitTypeDescriptionArticle10
      break
  }

  const headerContactDetails = data.isAgent ? headerApplicantContactDetails : pageContent.headerYourContactDetails

  const purposeCodeValueText = {
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
    Z: pageContent.rowTextPurposeCodeZ,
  }

  const sourceCodeValueText = {
    W: pageContent.rowTextSourceCodeW,
    R: pageContent.rowTextSourceCodeR,
    D: data.species.kingdom === "Animalia" ? pageContent.rowTextSourceCodeDAnimal : pageContent.rowTextSourceCodeDPlant,
    C: pageContent.rowTextSourceCodeC,
    F: pageContent.rowTextSourceCodeF,
    I: pageContent.rowTextSourceCodeI,
    O: pageContent.rowTextSourceCodeO,
    X: pageContent.rowTextSourceCodeX,
    Y: pageContent.rowTextSourceCodeY,
    A: pageContent.rowTextSourceCodeA,
    U: data.species.enterAReason
  }

  const otherSourceCodeValueText = {
    W: pageContent.rowTextSourceCodeW,
    R: pageContent.rowTextSourceCodeR,
    D: data.species.kingdom === "Animalia" ? pageContent.rowTextSourceCodeDAnimal : pageContent.rowTextSourceCodeDPlant,
    C: pageContent.rowTextSourceCodeC,
    F: pageContent.rowTextSourceCodeF,
    A: pageContent.rowTextSourceCodeA,
    X: pageContent.rowTextSourceCodeX,
    Y: pageContent.rowTextSourceCodeY,
  };

  const otherSourceCode = data.species.anotherSourceCodeForI || data.species.anotherSourceCodeForO

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

  let quantityValue = null
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType === "unmarked") {
    quantityValue = `${data.species.numberOfUnmarkedSpecimens} specimen${data.species.numberOfUnmarkedSpecimens > 1 ? 's' : ''}`
  } else if (data.species.specimenType === "animalLiving") {
    quantityValue = `1 specimen`
  } else {
    quantityValue = data.species?.quantity
  }


  let unitsOfMeasurementValue = null
  if (data.species.unitOfMeasurement && data.species.unitOfMeasurement === "noOfSpecimens") {
    unitsOfMeasurementValue = pageContent.rowTextUnitsOfMeasurementNoOfSpecimens
  } else if (data.species.unitOfMeasurement && data.species.unitOfMeasurement === "noOfPiecesOrParts") {
    unitsOfMeasurementValue = pageContent.rowTextUnitsOfMeasurementNoOfPiecesOrParts
  } else {
    unitsOfMeasurementValue = data.species?.unitOfMeasurement
  }

  let sexDescription = null
  if (data.species.sex && data.species.sex === "M") {
    sexDescription = pageContent.rowTextSexMale
  } else if (data.species.sex && data.species.sex === "F") {
    sexDescription = pageContent.rowTextSexFemale
  } else if (data.species.sex && data.species.sex === "U") {
    sexDescription = pageContent.rowTextNotKnown
  }



  const applicantContactDetailsData = {
    fullName: data.applicant.fullName,
    businessName: data.applicant.businessName,
    email: data.applicant.email,
    address: {
      addressLine1: data.applicant.address.addressLine1,
      addressLine2: data.applicant.address.addressLine2,
      addressLine3: data.applicant.address.addressLine3 ? data.applicant.address.addressLine3 : "",
      addressLine4: data.applicant.address.addressLine4 ? data.applicant.address.addressLine4 : "",
      postcode: data.applicant.address.postcode,
      country: data.applicant.address.country,
      countryDesc: data.applicant.address.countryDesc
    },
    hrefPathSuffixContactDetails: "/applicantContactDetails",
    hrefPathSuffixAddress: "/applicantAddress"
  }

  const deliveryAddressData = {
    addressLine1: data.delivery.address.addressLine1,
    addressLine2: data.delivery.address.addressLine2,
    addressLine3: data.delivery.address.addressLine3 ? data.delivery.address.addressLine3 : "",
    addressLine4: data.delivery.address.addressLine4 ? data.delivery.address.addressLine4 : "",
    postcode: data.delivery.address.postcode,
    country: data.delivery.address.country,
    countryDesc: data.delivery.address.countryDesc
  }

  const deliveryAddressDataValue = `${deliveryAddressData.addressLine1} ${deliveryAddressData.addressLine2} ${deliveryAddressData.addressLine3} ${deliveryAddressData.addressLine4} ${deliveryAddressData.countryDesc} ${deliveryAddressData.postcode}`

  let deliveryTypeDataValue = ""
  if (enableDeliveryType) {
    switch (data.delivery.deliveryType) {
      case dt.specialDelivery:
        deliveryTypeDataValue = pageContent.rowTextSpecialDelivery
        break
      case dt.standardDelivery:
        deliveryTypeDataValue = pageContent.rowTextStandardDelivery
    }
  }

  const exportOrReexportPermitDetailData = {
    notApplicable: data.permitDetails?.isExportOrReexportNotApplicable,
    country: data.permitDetails?.exportOrReexportCountry,
    countryDesc: data.permitDetails?.exportOrReexportCountryDesc,
    permitNumber: data.permitDetails?.exportOrReexportPermitNumber,
    permitIssueDate: {
      day: data.permitDetails?.exportOrReexportPermitIssueDate.day,
      month: data.permitDetails?.exportOrReexportPermitIssueDate.month,
      year: data.permitDetails?.exportOrReexportPermitIssueDate.year
    }
  }

  const countryOfOriginPermitDetailData = {
    notApplicable: data.permitDetails?.isCountryOfOriginNotApplicable,
    country: data.permitDetails?.countryOfOrigin,
    countryDesc: data.permitDetails?.countryOfOriginDesc,
    permitNumber: data.permitDetails?.countryOfOriginPermitNumber,
    permitIssueDate: {
      day: data.permitDetails?.countryOfOriginPermitIssueDate.day,
      month: data.permitDetails?.countryOfOriginPermitIssueDate.month,
      year: data.permitDetails?.countryOfOriginPermitIssueDate.year
    }
  }

  const importerExporterDetailsData = {
    isImporterExporterDetails: true,
    fullName: data.importerExporterDetails?.name,
    country: data.permitType !== "import" ? data.importerExporterDetails?.country : "",
    countryDesc: data.permitType !== "import" ? data.importerExporterDetails?.countryDesc : "",
    address: {
      addressLine1: data.importerExporterDetails?.addressLine1,
      addressLine2: data.importerExporterDetails?.addressLine2,
      addressLine3: data.importerExporterDetails?.addressLine3 ? data.importerExporterDetails?.addressLine3 : "",
      addressLine4: data.importerExporterDetails?.addressLine4 ? data.importerExporterDetails?.addressLine4 : "",
      postcode: data.importerExporterDetails?.postcode,
    }
  }

  const importerExporterAddressValue = `${importerExporterDetailsData.address.addressLine1} ${importerExporterDetailsData.address.addressLine2} ${importerExporterDetailsData.address.addressLine3} ${importerExporterDetailsData.address.addressLine4} ${importerExporterDetailsData.address.postcode}`


  const summaryListAboutThePermit = {
    id: "permitType",
    name: "permitType",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      createSummaryListRow("govuk-summary-list__row border-top", pageContent.rowTextPermitType, permitTypeValue, hrefPrefix + "/permitType", "permit type", summaryType),
    ]
  }

  const summaryListDeliveryAddress = {
    id: "deliveryAddress",
    name: "deliveryAddress",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      createSummaryListRow(deliveryTypeDataValue ? "govuk-summary-list__row--no-border border-top" : "border-top", pageContent.rowTextAddress, deliveryAddressDataValue, hrefPrefix + "/deliveryAddress", "delivery address", summaryType)
    ]
  }

  if (deliveryTypeDataValue) {
    summaryListDeliveryAddress.rows.push(createSummaryListRow("govuk-summary-list__row", pageContent.rowTextDeliveryType, deliveryTypeDataValue, hrefPrefix + "/deliveryType", "delivery type", summaryType))
  }


  let quantityHref
  if (data.species.specimenType === "animalLiving") {
    if (data.species.uniqueIdentificationMarkType === "unmarked") {
      quantityHref = hrefPrefix + "/unmarkedSpecimens"
    }
  }
  else {
    quantityHref = hrefPrefix + "/quantity"
  }

  const summaryListSpecimenDetailsRows = []
  summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border border-top", pageContent.rowTextScientificName, data.species.speciesName, hrefPrefix + "/speciesName", "species name", summaryType))
  if (data.species.specimenType !== "animalLiving" || data.species.uniqueIdentificationMarkType === "unmarked") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextQuantity, quantityValue, quantityHref, "quantity", summaryType))
  }
  if (data.species.specimenType !== "animalLiving") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextUnitOfMeasurement, unitsOfMeasurementValue, data.species.numberOfUnmarkedSpecimens ? hrefPrefix + "/unmarkedSpecimens" : hrefPrefix + "/quantity", "unit of measurement", summaryType))
  }
  summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextSourceCode, `${data.species.sourceCode} ${sourceCodeValueText[data.species.sourceCode]}`, hrefPrefix + "/sourceCode", "source code", summaryType))

  if (data.species.anotherSourceCodeForI || data.species.anotherSourceCodeForO) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextOtherSourceCode, `${otherSourceCode} ${otherSourceCodeValueText[otherSourceCode]}`, "", "", summaryType))
  }

  if (data.permitType !== "article10") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextPurposeCode, `${data.species.purposeCode} ${purposeCodeValueText[data.species.purposeCode]}`, hrefPrefix + "/purposeCode", "purpose code", summaryType))
  }
  summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextSpecimenType, specimenTypeValue[data.species.specimenType], hrefPrefix + "/specimenType", "specimen type", summaryType))
  if (data.species.specimenType !== "animalLiving") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextTradeTermCode, data.species.isTradeTermCode ? `${data.species.tradeTermCode} ${data.species.tradeTermCodeDesc}` : pageContent.rowTextNotKnown, hrefPrefix + "/tradeTermCode", "trade term code", summaryType))
  }
  if (data.permitType === "article10") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextA10SpecimenOrigin, a10SpecimenOriginValue[data.species.specimenOrigin], hrefPrefix + "/specimenOrigin", "specimen origin", summaryType))
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextA10CertificatePurpose, a10CertificatePurposeValue[data.species.useCertificateFor], hrefPrefix + "/useCertificateFor", "use certificate for", summaryType))
  }
  summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextUniqueIdentificationMark, data.species.uniqueIdentificationMark ? data.species.uniqueIdentificationMark : pageContent.rowTextSpecimenIsNotMarked, hrefPrefix + "/uniqueIdentificationMark", "unique identification mark", summaryType))
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextSex, sexDescription, hrefPrefix + "/describeLivingAnimal", "sex", summaryType))
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextDateOfBirth, data.species.dateOfBirth.year ? getDateValue(data.species.dateOfBirth) : "", hrefPrefix + "/describeLivingAnimal", "date of birth", summaryType))
  }
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked' && data.permitType === "article10") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextMaleParentDetails, data.species.maleParentDetails, hrefPrefix + "/describeLivingAnimal", "male parent details", summaryType))
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextFemaleParentDetails, data.species.femaleParentDetails, hrefPrefix + "/describeLivingAnimal", "female parent details", summaryType))
  }
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(data.permitType == "article10" ? "govuk-summary-list__row--no-border" : "", pageContent.rowTextOtherDescription, data.species.specimenDescriptionLivingAnimal ? data.species.specimenDescriptionLivingAnimal : "", hrefPrefix + "/describeLivingAnimal", "other description", summaryType))
  }
  if (data.species.specimenType === "animalWorked" || data.species.specimenType === "plantWorked") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextCreatedDate, data.species.createdDate.isExactDateUnknown ? data.species.createdDate.approximateDate : getDateValue(data.species.createdDate), hrefPrefix + "/createdDate", "created date", summaryType))
  }
  if (data.species.specimenType !== "animalLiving" || (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType === 'unmarked')) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(data.permitType === "article10" ? "govuk-summary-list__row--no-border" : "", pageContent.rowTextDescription, data.species.specimenDescriptionGeneric, hrefPrefix + "/descriptionGeneric", "description", summaryType))
  }
  if (data.permitType === "article10") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextAcquiredDate, data.species.acquiredDate.isExactDateUnknown ? data.species.acquiredDate.approximateDate : getDateValue(data.species.acquiredDate), hrefPrefix + "/acquiredDate", "acquired date", summaryType))
    summaryListSpecimenDetailsRows.push(createSummaryListRow("", pageContent.rowTextExistingArticle10Certificate, data.species.isA10CertificateNumberKnown ? data.species.a10CertificateNumber : pageContent.rowTextNotKnown, hrefPrefix + "/a10CertificateNumber", "existing a10 certificate", summaryType))
  }

  const summaryListSpecimenDetails = {
    id: "specimenDetails",
    name: "specimenDetails",
    classes: "govuk-!-margin-bottom-9",
    rows: summaryListSpecimenDetailsRows
  }

  const summaryListImporterExporterDetailsRows = []
  if (importerExporterDetailsData.country) {
    summaryListImporterExporterDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border border-top", pageContent.rowTextCountry, importerExporterDetailsData.countryDesc, hrefPrefix + "/importerExporterDetails", "country", summaryType))
  }
  summaryListImporterExporterDetailsRows.push(createSummaryListRow(importerExporterDetailsData.country ? "govuk-summary-list__row--no-border" : "govuk-summary-list__row--no-border border-top", pageContent.rowTextFullName, importerExporterDetailsData.fullName, hrefPrefix + "/importerExporterDetails", "contact details", summaryType))
  summaryListImporterExporterDetailsRows.push(createSummaryListRow("", pageContent.rowTextAddress, importerExporterAddressValue, "", "", summaryType))

  const summaryListImporterExporterDetails = {
    id: "importerExporterDetail",
    name: "importerExporterDetail",
    rows: summaryListImporterExporterDetailsRows
  }

  const summaryListRemarks = {
    id: "remarks",
    name: "remarks",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      createSummaryListRow(enableInternalReference ? "govuk-summary-list__row--no-border border-top" : "border-top", pageContent.rowTextRemarks, data.comments, hrefPrefix + "/additionalInfo", "remarks", summaryType),
    ]
  }

  if (enableInternalReference) {
    summaryListRemarks.rows.push(createSummaryListRow("govuk-summary-list__row", pageContent.rowTextInternalReference, data.internalReference, hrefPrefix + "/additionalInfo", "internal reference", summaryType))
  }

  const summaryListApplicantContactDetails = getContactDetails(pageContent, applicantContactDetailsData, hrefPrefix, summaryType)
  const summaryListExportOrReexportPermitDetails = data.permitDetails && getPermitDetails(pageContent, exportOrReexportPermitDetailData, hrefPrefix, summaryType)
  const summaryListCountryOfOriginPermitDetails = data.permitDetails && getPermitDetails(pageContent, countryOfOriginPermitDetailData, hrefPrefix, summaryType)

  let submissionLink = `${previousPathMySubmission}/${data.cloneSource ? data.cloneSource.submissionRef : data.submissionRef}`
  let applicationLink = `${currentPath}/view-submitted/${data.cloneSource ? data.cloneSource.applicationIndex : data.applicationIndex}`

  //const breadcrumbsUrlApplicationIndex = data.clonedApplicationIndex ? data.clonedApplicationIndex : data.applicationIndex
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
      //href: `${previousPathMySubmission}/${data.submissionRef}`,
      href: submissionLink
    })
  }

  if (applicationRef) {
    breadcrumbs.items.push({
      text: applicationRef,
      href: summaryType === 'copy-as-new' ? applicationLink : "#"
    })
  }

  if (summaryType === 'copy-as-new') {
    breadcrumbs.items.push({
      text: pageContent.pageHeaderCopy,
      href: "#"
    })
  }

  let backLink = null;
  if (summaryType !== 'view-submitted' && summaryType !== 'copy-as-new') {
    if (summaryType === 'check') {
      backLink = data.referer?.endsWith(nextPathYourSubmission) ? nextPathYourSubmission : `${previousPathAdditionalInfo}/${data.applicationIndex}`
    } else {
      backLink = nextPathYourSubmission
    }
  }

  const model = {
    backLink,
    breadcrumbs: summaryType === 'view-submitted' || summaryType === 'copy-as-new' ? breadcrumbs : "",
    pageHeader,
    pageTitle,
    buttonText,
    showButton,
    formActionPage: `${currentPath}/${data.summaryType}/${data.applicationIndex}`,
    headerPermit: pageContent.headerPermit,
    headerContactDetails: headerContactDetails,
    headerDeliveryAddress: pageContent.headerDeliveryAddress,
    headerSpecimenDetails: pageContent.headerSpecimenDetails,
    headingImporterExporterDetails: headingImporterExporterDetails,
    headingPermitDetails: data.permitDetails && headingPermitDetails,
    headerCountryOfOriginPermitDetails: data.permitDetails && pageContent.headerCountryOfOriginPermitDetails,
    headerAdditionalInformation: pageContent.headerAdditionalInformation,
    returnToYourApplicationsLinkText: summaryType === 'view-submitted' ? pageContent.returnToYourApplicationsLinkText : "",
    returnToYourApplicationsLinkUrl: summaryType === 'view-submitted' ? `${urlPrefix}/my-submissions` : "",

    summaryListAboutThePermit: summaryListAboutThePermit,
    summaryListApplicantContactDetails: summaryListApplicantContactDetails,
    summaryListDeliveryAddress: summaryListDeliveryAddress,
    summaryListSpecimenDetails: summaryListSpecimenDetails,
    summaryListImporterExporterDetails: data.permitType !== "article10" && summaryListImporterExporterDetails,
    summaryListExportOrReexportPermitDetails: summaryListExportOrReexportPermitDetails,
    summaryListCountryOfOriginPermitDetails: summaryListCountryOfOriginPermitDetails,
    summaryListRemarks: summaryListRemarks
  }
  return { ...commonContent, ...model }
}



function createSummaryListRow(classes, key, value, href, hiddenText, summaryType) {
  const summaryListRow = {
    classes: classes,
    key: {
      text: key
    },
    value: {
      text: value
    },
    actions: {
      items: href && summaryType !== 'view' && summaryType !== 'view-submitted' ? [
        {
          href: href,
          text: changeLinkText,
          visuallyHiddenText: hiddenText
        }
      ] : []
    }
  }
  return summaryListRow
}

function getDateValue(date) {
  const day = date.day?.toString().padStart(2, '0')
  const month = date.month.toString().padStart(2, '0')
  if (date.day) {
    return `${day} ${month} ${date.year}`
  } else {
    return `${month} ${date.year}`
  }
}

function getContactDetails(pageContent, contactDetailsData, hrefPrefix, summaryType) {
  const summaryListContactDetailsRows = []
  summaryListContactDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border border-top", pageContent.rowTextFullName, contactDetailsData.fullName, hrefPrefix + contactDetailsData.hrefPathSuffixContactDetails, "contact details", summaryType))
  summaryListContactDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextBusinessName, contactDetailsData.businessName, "", "", summaryType))
  summaryListContactDetailsRows.push(createSummaryListRow("", pageContent.rowTextEmailAddress, contactDetailsData.email, "", "", summaryType))
  summaryListContactDetailsRows.push(createSummaryListRow("", pageContent.rowTextAddress, `${contactDetailsData.address.addressLine1} ${contactDetailsData.address.addressLine2} ${contactDetailsData.address.addressLine3} ${contactDetailsData.address.addressLine4} ${contactDetailsData.address.countryDesc} ${contactDetailsData.address.postcode}`, hrefPrefix + contactDetailsData.hrefPathSuffixAddress, "address", summaryType))

  return {
    id: "contactDetails",
    name: "contactDetails",
    rows: summaryListContactDetailsRows
  }
}

function getPermitDetails(pageContent, permitDetailsData, hrefPrefix, summaryType) {
  const summaryListPermitDetailsRows = []
  summaryListPermitDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border border-top", pageContent.rowTextCountry, permitDetailsData.notApplicable ? pageContent.rowTextNotApplicable : permitDetailsData.countryDesc, hrefPrefix + "/permitDetails", "permit details", summaryType))
  summaryListPermitDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextPermitNumber, permitDetailsData.notApplicable ? pageContent.rowTextNotApplicable : permitDetailsData.permitNumber, "", "", summaryType))
  summaryListPermitDetailsRows.push(createSummaryListRow("", pageContent.rowTextPermitIssueDate, permitDetailsData.notApplicable ? pageContent.rowTextNotApplicable : getDateValue(permitDetailsData.permitIssueDate), "", "", summaryType))

  return {
    id: "permitDetails",
    name: "permitDetails",
    classes: "govuk-!-margin-bottom-9",
    rows: summaryListPermitDetailsRows
  }
}

function createAreYouSureModel(errors, data) {
  const commonContent = textContent.common
  const changeType = data.changeRouteData.changeType
  const areYouSureText = textContent.applicationSummary.areYouSure

  let pageContent = null
  if (changeType === "permitType") {
    pageContent = areYouSureText.permitType
  } else if (changeType === "speciesName") {
    pageContent = areYouSureText.scientificName
  } else if (changeType === "deliveryAddress") {
    pageContent = areYouSureText.deliveryAddress
  } else if (!data.isAgent) {
    if (changeType === "applicantContactDetails") {
      pageContent = areYouSureText.yourContactDetails
    } else if (changeType === "applicantAddress") {
      pageContent = areYouSureText.yourAddress
    }
  } else if (data.isAgent) {
    if (changeType === "applicantContactDetails") {
      switch (data.permitType) {
        case "import":
          pageContent = areYouSureText.importerContactDetails
          break
        case "export":
          pageContent = areYouSureText.exporterContactDetails
          break
        case "reexport":
          pageContent = areYouSureText.reexporterContactDetails
          break
        case "article10":
          pageContent = areYouSureText.article10ContactDetails
          break
      }
    } else if (changeType === "applicantAddress") {
      switch (data.permitType) {
        case "import":
          pageContent = areYouSureText.importerAddress
          break
        case "export":
          pageContent = areYouSureText.exporterAddress
          break
        case "reexport":
          pageContent = areYouSureText.reexporterAddress
          break
        case "article10":
          pageContent = areYouSureText.article10Address
          break
      }
    }
  }

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["areYouSure"]
    fields.forEach((field) => {
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
    backLink: `${currentPath}/${data.summaryType}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/are-you-sure/${data.summaryType}/${data.applicationIndex}`,
    ...(errorList ? { errorList } : {}),
    pageTitle: errorList
      ? commonContent.errorSummaryTitlePrefix + errorList[0].text
      : pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    pageBody: pageContent.pageBody2 ? `${pageContent.pageBody1} ${data.permitType} ${pageContent.pageBody2}` : pageContent.pageBody1,

    inputAreYouSure: {
      idPrefix: "areYouSure",
      name: "areYouSure",
      classes: "govuk-radios--inline",
      items: [
        {
          value: true,
          text: commonContent.radioOptionYes,
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
        }
      ],
      errorMessage: getFieldError(errorList, "#areYouSure")
    }
  }
  return { ...commonContent, ...model }
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
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { summaryType, applicationIndex } = request.params
      let submission = getSubmission(request)

      // let submission

      let cloneSource = null
      if (summaryType === 'copy-as-new' || (!submission.submissionRef && summaryType === 'view-submitted')) {
        cloneSource = getYarValue(request, 'cloneSource')
      }

      if (cloneSource?.submissionRef && summaryType === 'view-submitted') {
        //When coming back from the copy-as-new page, load the source back in from dynamics instead of the clone
        const { user: { organisationId } } = getYarValue(request, 'CIDMAuth')
        submission = await dynamics.getSubmission(request.server, request.auth.credentials.contactId, organisationId, cloneSource?.submissionRef)
        setYarValue(request, 'submission', submission)
        setYarValue(request, 'cloneSource', null)
      }


      try {
        validateSubmission(submission, `${pageId}/${summaryType}/${applicationIndex}`)
      } catch (err) {
        console.error(err)
        return h.redirect(invalidSubmissionPath)
      }

      clearChangeRoute(request)

      const pageData = {
        referer: request.headers.referer,
        summaryType: summaryType,
        applicationIndex: applicationIndex,
        cloneSource,
        //clonedApplicationIndex: clonedApplicationIndex,
        //submissionRef: submission.submissionRef || clonedSubmissionRef,
        submissionRef: submission.submissionRef,
        permitType: submission.permitType,
        isAgent: submission.isAgent,
        applicant: submission.applicant,
        delivery: submission.delivery,
        applicationRef: submission.applications[applicationIndex].applicationRef,
        species: submission.applications[applicationIndex].species,
        importerExporterDetails: submission.applications[applicationIndex]?.importerExporterDetails,
        permitDetails: submission.applications[applicationIndex].permitDetails,
        comments: submission.applications[applicationIndex].comments,
        internalReference: submission.applications[applicationIndex].internalReference,
        isCurrentUsersApplication: submission.contactId === request.auth.credentials.contactId
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
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { applicationIndex, changeType, summaryType } = request.params

      const returnUrl = `${currentPath}/${summaryType}/${applicationIndex}`
      const changeRouteData = setChangeRoute(request, changeType, applicationIndex, returnUrl)

      if (changeRouteData.showConfirmationPage) {
        return h.redirect(`${currentPath}/are-you-sure/${summaryType}/${applicationIndex}`)
      } else {
        return h.redirect(changeRouteData.startUrl)
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
        validateSubmission(submission, `${pageId}/are-you-sure/${summaryType}/${applicationIndex}`)
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
      return h.view('are-you-sure', createAreYouSureModel(null, pageData))
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
        failAction: (request, h, err) => {
          const { summaryType, applicationIndex } = request.params
          const submission = getSubmission(request)
          const pageData = {
            referer: request.headers.referer,
            summaryType: summaryType,
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            isAgent: submission.isAgent,
            applicant: submission.applicant,
            delivery: submission.delivery,
            applicationRef: submission.applications[applicationIndex].applicationRef,
            species: submission.applications[applicationIndex].species,
            importerExporterDetails: submission.applications[applicationIndex]?.importerExporterDetails,
            permitDetails: submission.applications[applicationIndex].permitDetails,
            comments: submission.applications[applicationIndex].comments,
            isCurrentUsersApplication: submission.contactId === request.auth.credentials.contactId
          }
          return h.view(pageId, createApplicationSummaryModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { summaryType, applicationIndex } = request.params

        if (summaryType === 'view-submitted') {
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

          return h.view('are-you-sure', createAreYouSureModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex, summaryType } = request.params
        const changeRouteData = getChangeRouteData(request)

        if (request.payload.areYouSure) {
          return h.redirect(changeRouteData.startUrl)
        } else {
          return h.redirect(`${currentPath}/${summaryType}/${applicationIndex}`)
        }
      }
    }
  }
]

