const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getYarValue, setYarValue } = require('../lib/session')
const { getSubmission, mergeSubmission, validateSubmission, cloneSubmission } = require("../lib/submission")
const { setChangeRoute, clearChangeRoute, getChangeRouteData, changeTypes } = require("../lib/change-route")
const dynamics = require("../services/dynamics-service")
const textContent = require("../content/text-content")
const pageId = "application-summary"
const currentPath = `${urlPrefix}/${pageId}`
const previousPathComments = `${urlPrefix}/comments`
const previousPathMySubmissions = `${urlPrefix}/my-submissions`
const previousPathMySubmission = `${urlPrefix}/my-submission`
const nextPathYourSubmission = `${urlPrefix}/your-submission`
const nextPathCopyAsNewApplication = `${urlPrefix}/application-summary/copy-as-new`
const invalidSubmissionPath = `${urlPrefix}/`
const summaryTypes = ['check', 'view', 'copy', 'view-submitted', 'copy-as-new']


function createApplicationSummaryModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.applicationSummary
  const summaryType = data.summaryType
  const formattedApplicationIndex = data.clonedApplicationIndex ? (data.clonedApplicationIndex + 1).toString().padStart(3, '0') : (data.applicationIndex + 1).toString().padStart(3, '0')
  const hrefPrefix = `../../application-summary/${summaryType}/change/${data.applicationIndex}`
  

  let pageTitle = null
  let pageHeader = null
  let buttonText = null

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
      pageTitle = `${data.submissionRef}/${formattedApplicationIndex}`
      pageHeader = `${data.submissionRef}/${formattedApplicationIndex}`
      buttonText = commonContent.copyAsNewApplicationButton
      break
  }

  let headerApplicantContactDetails = null
  let headingImporterExporterDetails = null
  let headingPermitDetails = null
  switch (data.permitType) {
    case "import":
      headerApplicantContactDetails = pageContent.headerImporterContactDetails
      headingImporterExporterDetails = pageContent.headerExportOrReexporterContactDetails
      headingPermitDetails = pageContent.headerExportOrReexportPermitDetails
      break
    case "export":
      headerApplicantContactDetails = pageContent.headerExporterContactDetails
      headingImporterExporterDetails = pageContent.headerImporterContactDetails
      break
    case "reexport":
      headerApplicantContactDetails = pageContent.headerReexporterContactDetails
      headingImporterExporterDetails = pageContent.headerImporterContactDetails
      headingPermitDetails = pageContent.headerPermitDetailsFromExportIntoGreatBritain
      break
    case "article10":
      headerApplicantContactDetails = pageContent.headerArticle10ContactDetails
      headingPermitDetails = pageContent.headerPermitDetailsFromExportIntoGreatBritain
      break
  }

  let purposeCodeValueText = null
  switch (data.species.purposeCode) {
    case "B":
      purposeCodeValueText = pageContent.rowTextPurposeCodeB
      break
    case "E":
      purposeCodeValueText = pageContent.rowTextPurposeCodeE
      break
    case "G":
      purposeCodeValueText = pageContent.rowTextPurposeCodeG
      break
    case "H":
      purposeCodeValueText = pageContent.rowTextPurposeCodeH
      break
    case "L":
      purposeCodeValueText = pageContent.rowTextPurposeCodeL
      break
    case "M":
      purposeCodeValueText = pageContent.rowTextPurposeCodeM
      break
    case "N":
      purposeCodeValueText = pageContent.rowTextPurposeCodeN
      break
    case "P":
      purposeCodeValueText = pageContent.rowTextPurposeCodeP
      break
    case "Q":
      purposeCodeValueText = pageContent.rowTextPurposeCodeQ
      break
    case "S":
      purposeCodeValueText = pageContent.rowTextPurposeCodeS
      break
    case "T":
      purposeCodeValueText = pageContent.rowTextPurposeCodeT
      break
    case "Z":
      purposeCodeValueText = pageContent.rowTextPurposeCodeZ
      break
  }

  let sourceCodeValueText = null
  switch (data.species.sourceCode) {
    case "W":
      sourceCodeValueText = pageContent.rowTextSourceCodeW
      break
    case "R":
      sourceCodeValueText = pageContent.rowTextSourceCodeR
      break
    case "D":
      sourceCodeValueText = data.species.kingdom === "Animalia" ? pageContent.rowTextSourceCodeDAnimal : pageContent.rowTextSourceCodeDPlant
      break
    case "C":
      sourceCodeValueText = pageContent.rowTextSourceCodeC
      break
    case "F":
      sourceCodeValueText = pageContent.rowTextSourceCodeF
      break
    case "I":
      sourceCodeValueText = pageContent.rowTextSourceCodeI
      break
    case "O":
      sourceCodeValueText = pageContent.rowTextSourceCodeO
      break
    case "X":
      sourceCodeValueText = pageContent.rowTextSourceCodeX
      break
    case "Y":
      sourceCodeValueText = pageContent.rowTextSourceCodeY
      break
    case "A":
      sourceCodeValueText = pageContent.rowTextSourceCodeA
      break
    case "U":
      sourceCodeValueText = data.species.enterAReason
      break
  }

  // const statusTextMap = {
  //   received: pageContent.rowTextReceived,
  //   awaitingPayment: pageContent.rowTextAwaitingPayment,
  //   awaitingReply: pageContent.rowTextAwaitingReply,
  //   inProcess: pageContent.rowTextInProcess,
  //   issued: pageContent.rowTextIssued,
  //   refused: pageContent.rowTextRefused,
  //   cancelled: pageContent.rowTextCancelled,
  // };

  let specimenTypeValue = null
  switch (data.species.specimenType) {
    case "animalLiving":
      specimenTypeValue = pageContent.rowTextSpecimenTypeAnimalLiving
      break
    case "animalPart":
      specimenTypeValue = pageContent.rowTextSpecimenTypeAnimalPart
      break
    case "animalWorked":
      specimenTypeValue = pageContent.rowTextSpecimenTypeAnimalWorked
      break
    case "animalCoral":
      specimenTypeValue = pageContent.rowTextSpecimenTypeAnimalCoral
      break
    case "plantLiving":
      specimenTypeValue = pageContent.rowTextSpecimenTypePlantLiving
      break
    case "plantWorked":
      specimenTypeValue = pageContent.rowTextSpecimenTypePlantProduct
      break
    case "plantProduct":
      specimenTypeValue = pageContent.rowTextSpecimenTypePlantWorked
      break
  }

  let a10CertificatePurposeValue = null

  switch (data.species.useCertificateFor) {
    case "legallyAcquired":
      a10CertificatePurposeValue = pageContent.rowTextLegallyAcquired
      break
    case "commercialActivities":
      a10CertificatePurposeValue = pageContent.rowTextCommercialActivities
      break
    case "moveALiveSpecimen":
      a10CertificatePurposeValue = pageContent.rowTextMoveALiveSpecimen
      break
    case "other":
      a10CertificatePurposeValue = pageContent.rowTextOther
      break
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
  } else if (data.species.sex && data.species.sex === "U"){
    sexDescription = pageContent.rowTextNotKnown
  }



  let yourContactDetailsData = null
  if (!data.isAgent) {
    yourContactDetailsData = {
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
  } else {
    yourContactDetailsData = {
      fullName: data.agent.fullName,
      businessName: data.agent.businessName,
      email: data.agent.email,
      address: {
        addressLine1: data.agent.address.addressLine1,
        addressLine2: data.agent.address.addressLine2,
        addressLine3: data.agent.address.addressLine3 ? data.agent.address.addressLine3 : "",
        addressLine4: data.agent.address.addressLine4 ? data.agent.address.addressLine4 : "",
        postcode: data.agent.address.postcode,
        country: data.agent.address.country,
        countryDesc: data.agent.address.countryDesc
      },
      hrefPathSuffixContactDetails: "/agentContactDetails",
      hrefPathSuffixAddress: "/agentAddress"
    }
  }

  const agentApplicantContactDetailsData = {
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
      createSummaryListRow("govuk-summary-list__row border-top", pageContent.rowTextPermitType, data.permitType, hrefPrefix + "/permitType", "permit type", summaryType),
    ]
  }

  const summaryListDeliveryAddress = {
    id: "deliveryAddress",
    name: "deliveryAddress",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      createSummaryListRow("govuk-summary-list__row border-top", pageContent.rowTextAddress, deliveryAddressDataValue, hrefPrefix + "/deliveryAddress", "delivery address", summaryType),
    ]
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
  summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextSourceCode, `${data.species.sourceCode} ${sourceCodeValueText}`, hrefPrefix + "/sourceCode", "source code", summaryType))
  
  if (data.species.anotherSourceCodeForI || data.species.anotherSourceCodeForO) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextOtherSourceCode, `${data.species.anotherSourceCodeForI || data.species.anotherSourceCodeForO} ${sourceCodeValueText}`,  "", "", summaryType))
  }
  
  if (data.permitType !== "article10") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextPurposeCode, `${data.species.purposeCode} ${purposeCodeValueText}`, hrefPrefix + "/purposeCode", "purpose code", summaryType))
  }
  summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextSpecimenType, specimenTypeValue, hrefPrefix + "/specimenType", "specimen type", summaryType))
  if (data.species.specimenType !== "animalLiving") {
     summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextTradeTermCode, data.species.isTradeTermCode ? `${data.species.tradeTermCode} ${data.species.tradeTermCodeDesc}` : pageContent.rowTextNotKnown, hrefPrefix + "/tradeTermCode", "trade term code", summaryType))
  }
  if (data.permitType === "article10") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextA10CertificatePurpose, a10CertificatePurposeValue, hrefPrefix + "/useCertificateFor", "use certificate for", summaryType))
  }
  summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextUniqueIdentificationMark, data.species.uniqueIdentificationMark ? data.species.uniqueIdentificationMark : pageContent.rowTextSpecimenIsNotMarked, hrefPrefix + "/uniqueIdentificationMark", "unique identification mark", summaryType))
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextSex, sexDescription, hrefPrefix + "/describeLivingAnimal", "sex", summaryType))
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextDateOfBirth, data.species.dateOfBirth.year ? getDateValue(data.species.dateOfBirth) : "", hrefPrefix + "/describeLivingAnimal", "date of birth", summaryType))
  }
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked' && data.permitType === "article10") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextParentDetails, data.species.parentDetails, hrefPrefix + "/describeLivingAnimal", "parent details", summaryType))
  }
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(data.permitType == "article10" ? "govuk-summary-list__row--no-border" : "", pageContent.rowTextOtherDescription, data.species.specimenDescriptionLivingAnimal ? data.species.specimenDescriptionLivingAnimal : "", hrefPrefix + "/describeLivingAnimal", "other description", summaryType))
  }
  if (data.species.specimenType === "animalWorked" || data.species.specimenType === "plantWorked") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border", pageContent.rowTextCreatedDate, data.species.createdDate.isExactDateUnknown ? data.species.createdDate.approximateDate : getDateValue(data.species.createdDate), hrefPrefix + "/createdDate", "created date", summaryType))
  }
  if (data.species.specimenType !== "animalLiving" || (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType === 'unmarked', summaryType)) {
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
      createSummaryListRow("govuk-summary-list__row border-top", pageContent.headerRemarks, data.comments, hrefPrefix + "/comments", "remarks", summaryType),
    ]
  }
  const summaryListYourContactDetails = getContactDetails(pageContent, yourContactDetailsData, hrefPrefix, summaryType)
  const summaryListApplicantContactDetails = data.isAgent && getContactDetails(pageContent, agentApplicantContactDetailsData, hrefPrefix, summaryType)
  const summaryListExportOrReexportPermitDetails = data.permitDetails && getPermitDetails(pageContent, exportOrReexportPermitDetailData, hrefPrefix, summaryType)
  const summaryListCountryOfOriginPermitDetails = data.permitDetails && getPermitDetails(pageContent, countryOfOriginPermitDetailData, hrefPrefix, summaryType)
 
  const breadcrumbsUrlApplicationIndex = data.clonedApplicationIndex ? data.clonedApplicationIndex  : data.applicationIndex
  const breadcrumbs = {
    items: [
      {
        text: pageContent.textBreadcrumbs,
        href: previousPathMySubmissions,
      },
      {
        text: data.submissionRef,
        href: `${previousPathMySubmission}/${data.submissionRef}`,
      },
      {
        text: `${data.submissionRef}/${formattedApplicationIndex}`,
        href: summaryType === 'copy-as-new' ? `${currentPath}/view-submitted/${breadcrumbsUrlApplicationIndex}`: "#"
      },
      summaryType === 'copy-as-new' && {
        text: pageContent.pageHeaderCopy,
        href: "#"
      }
    ]
  }

  const backLink =  summaryType === 'check' ? `${previousPathComments}/${data.applicationIndex}` : nextPathYourSubmission

  const model = {
    backLink: summaryType !== 'view-submitted' && summaryType !== 'copy-as-new'? backLink : "",
    breadcrumbs: summaryType === 'view-submitted' || summaryType === 'copy-as-new' ? breadcrumbs : "",
    pageHeader: pageHeader,
    pageTitle: pageTitle,
    buttonText: buttonText,
    formActionPage: `${currentPath}/${data.summaryType}/${data.applicationIndex}`,
    headerPermit: pageContent.headerPermit,
    headerYourContactDetails: pageContent.headerYourContactDetails,
    headerApplicantContactDetails: data.isAgent ? headerApplicantContactDetails : "",
    headerDeliveryAddress: pageContent.headerDeliveryAddress,
    headerSpecimenDetails: pageContent.headerSpecimenDetails,
    headingImporterExporterDetails: headingImporterExporterDetails,
    headingPermitDetails: data.permitDetails && headingPermitDetails,
    headerCountryOfOriginPermitDetails: data.permitDetails && pageContent.headerCountryOfOriginPermitDetails,
    headerRemarks: pageContent.headerRemarks,
    returnToYourApplicationsLinkText: summaryType === 'view-submitted' ? pageContent.returnToYourApplicationsLinkText : "",
    returnToYourApplicationsLinkUrl: summaryType === 'view-submitted' ? `${urlPrefix}/my-submissions` : "",

    summaryListAboutThePermit: summaryListAboutThePermit,
    summaryListYourContactDetails: summaryListYourContactDetails,
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
      items: [
        summaryType !== 'view' &&  summaryType !== 'view-submitted' && {
          href: href,
          text: href ? "Change" : "",
          visuallyHiddenText: hiddenText
        }
      ]
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
  summaryListContactDetailsRows.push(createSummaryListRow("govuk-summary-list__row--no-border border-top", pageContent.rowTextFullName, contactDetailsData.fullName, hrefPrefix + contactDetailsData.hrefPathSuffixContactDetails, "contact details", summaryType ))
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
  } else if (changeType === "agentContactDetails") {
    pageContent = areYouSureText.yourContactDetails
  } else if (changeType === "agentAddress") {
    pageContent = areYouSureText.yourAddress
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
          checked: data.areYouSure
        },
        {
          value: false,
          text: commonContent.radioOptionNo,
          checked: data.areYouSure === false
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

      let clonedSubmissionRef
      let clonedApplicationIndex
      if (summaryType === 'copy-as-new' || (!submission.submissionRef && summaryType === 'view-submitted')) {
        const cloneSource = getYarValue(request, 'cloneSource')
        clonedSubmissionRef = cloneSource.submissionRef
        clonedApplicationIndex = cloneSource.applicationIndex
      }

      if (clonedSubmissionRef && summaryType === 'view-submitted'){
        submission = await dynamics.getSubmission(request.server, request.auth.credentials.contactId, clonedSubmissionRef)
        submission.submissionRef = clonedSubmissionRef
        setYarValue(request, 'submission', submission)      
      }
      

      try {
        validateSubmission(submission,`${pageId}/${summaryType}/${applicationIndex}`)
      } catch (err) {
        console.log(err)
        return h.redirect(invalidSubmissionPath)
      }

      clearChangeRoute(request)

      const pageData = {
        summaryType: summaryType,
        applicationIndex: applicationIndex,
        clonedApplicationIndex:clonedApplicationIndex,
        submissionRef: submission.submissionRef || clonedSubmissionRef,
        permitType: submission.permitType,
        isAgent: submission.isAgent,
        applicant: submission.applicant,
        agent: submission?.agent,
        delivery: submission.delivery,
        species: submission.applications[applicationIndex].species,
        importerExporterDetails: submission.applications[applicationIndex]?.importerExporterDetails,
        permitDetails: submission.applications[applicationIndex].permitDetails,
        comments: submission.applications[applicationIndex].comments,
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
        console.log(err)
        return h.redirect(invalidSubmissionPath)
      }

      const pageData = {
        summaryType: summaryType,
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        isAgent: submission.isAgent,
        changeRouteData: changeRouteData,
        areYouSure: submission.areYouSure,
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
            summaryType: summaryType,
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            isAgent: submission.isAgent,
            applicant: submission.applicant,
            agent: submission?.agent,
            delivery: submission.delivery,
            species: submission.applications[applicationIndex].species,
            importerExporterDetails: submission.applications[applicationIndex]?.importerExporterDetails,
            permitDetails: submission.applications[applicationIndex].permitDetails,
            comments: submission.applications[applicationIndex].comments,
          }
          return h.view(pageId, createApplicationSummaryModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { summaryType, applicationIndex } = request.params
       
        if (summaryType === 'view-submitted'){
            try {
              cloneSubmission(request, applicationIndex)
            } catch (err) {
              console.log(err)
              return h.redirect(invalidSubmissionPath)
            }
          return h.redirect(`${nextPathCopyAsNewApplication}/0`)
        } else {
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

          let areYouSure = null
          switch (request.payload.areYouSure) {
            case "true":
              areYouSure = true
              break
            case "false":
              areYouSure = false
              break
          }

          const pageData = {
            summaryType:summaryType,
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            isAgent: submission.isAgent,
            changeRouteData: changeRouteData,
            areYouSure: areYouSure,
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

