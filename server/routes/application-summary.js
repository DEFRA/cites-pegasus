const Joi = require("joi")
const { urlPrefix, enableDeliveryType, enableInternalReference } = require("../../config/config")
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getYarValue, setYarValue } = require('../lib/session')
const { deliveryType: dt } = require("../lib/constants")
const { permitType: pt, permitTypeOption: pto, getPermitDescription } = require("../lib/permit-type-helper")
const { getSubmission, mergeSubmission, validateSubmission, cloneSubmission, saveDraftSubmission, checkDraftSubmissionExists, allowPageNavigation } = require("../lib/submission")
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

const pageContent = textContent.applicationSummary
const commonContent = textContent.common

function createApplicationSummaryModel(errors, data) {
  const summaryType = data.summaryType
  const submissionRef = data.submissionRef || data.cloneSource?.submissionRef
  const applicationRef = data.cloneSource ? data.cloneSource.applicationRef : data.applicationRef

  const summaryData = {
    summaryType,
    hrefPrefix: `../../application-summary/${summaryType}/change/${data.applicationIndex}`,
    mandatoryFieldIssues: data.mandatoryFieldIssues
  }

  const {
    pageTitle,
    pageHeader,
    buttonText,
    showConfirmButton,
    headerApplicantContactDetails,
    headingImporterExporterDetails,
    headingPermitDetails,
    permitTypeValue,
    purposeCodeValueText,
    sourceCodeValueText,
    otherSourceCodeValueText,
    specimenTypeValue,
    a10SpecimenOriginValue,
    a10CertificatePurposeValue
  } = lookupTextContent(data, applicationRef)

  let quantityValue = null
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType === "unmarked") {
    quantityValue = `${data.species.numberOfUnmarkedSpecimens} specimen${data.species.numberOfUnmarkedSpecimens > 1 ? 's' : ''}`
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
      case dt.SPECIAL_DELIVERY:
        deliveryTypeDataValue = pageContent.rowTextSpecialDelivery
        break
      case dt.STANDARD_DELIVERY:
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
    country: data.permitType !== pt.IMPORT ? data.importerExporterDetails?.country : "",
    countryDesc: data.permitType !== pt.IMPORT ? data.importerExporterDetails?.countryDesc : "",
    address: {
      addressLine1: data.importerExporterDetails?.addressLine1 || "",
      addressLine2: data.importerExporterDetails?.addressLine2 || "",
      addressLine3: data.importerExporterDetails?.addressLine3 || "",
      addressLine4: data.importerExporterDetails?.addressLine4 || "",
      postcode: data.importerExporterDetails?.postcode || "",
    }
  }

  const importerExporterAddressValue = `${importerExporterDetailsData.address.addressLine1} ${importerExporterDetailsData.address.addressLine2} ${importerExporterDetailsData.address.addressLine3} ${importerExporterDetailsData.address.addressLine4} ${importerExporterDetailsData.address.postcode}`

  const summaryListSections = []

  summaryListSections.push({
    key: 'summaryListAboutThePermit',
    value: {
      id: "permitType",
      name: "permitType",
      classes: "govuk-!-margin-bottom-9",
      rows: [
        createSummaryListRow(summaryData, ["permitTypeOption", "otherPermitTypeOption"], pageContent.rowTextPermitType, permitTypeValue, "/permitType", "permit type"),
      ]
    }
  })


  const summaryListDeliveryAddressRows = []

  summaryListDeliveryAddressRows.push(createSummaryListRow(summaryData, "delivery-address", pageContent.rowTextAddress, deliveryAddressDataValue, "/deliveryAddress", "delivery address"))

  if (deliveryTypeDataValue) {
    summaryListDeliveryAddressRows.push(createSummaryListRow(summaryData, "deliveryType", pageContent.rowTextDeliveryType, deliveryTypeDataValue, "/deliveryType", "delivery type"))
  }

  summaryListSections.push({
    key: 'summaryListDeliveryAddress',
    value: {
      id: "deliveryAddress",
      name: "deliveryAddress",
      classes: "govuk-!-margin-bottom-9",
      rows: summaryListDeliveryAddressRows
    }
  })

  const summaryListSpecimenDetailsRows = []
  summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "speciesName", pageContent.rowTextScientificName, data.species.speciesName, "/speciesName", "species name"))
  if (data.species.specimenType !== "animalLiving" || (data.species.uniqueIdentificationMarkType === "unmarked" && data.species.numberOfUnmarkedSpecimens)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "quantity", pageContent.rowTextQuantity, quantityValue, "/quantity", "quantity"))
  }
  if (data.species.specimenType !== "animalLiving") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "unitOfMeasurement", pageContent.rowTextUnitOfMeasurement, unitsOfMeasurementValue, data.species.numberOfUnmarkedSpecimens ? "/unmarkedSpecimens" : "/quantity", "unit of measurement"))
  }
  summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ["sourceCode", "enterAReason"], pageContent.rowTextSourceCode, `${data.species.sourceCode || ""} ${sourceCodeValueText[data.species.sourceCode] || ""}`, "/sourceCode", "source code"))

  if (data.species.sourceCode === 'I') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "anotherSourceCodeForI", pageContent.rowTextOtherSourceCode, `${data.species.anotherSourceCodeForI || ""} ${otherSourceCodeValueText[data.species.anotherSourceCodeForI] || ""}`, "/sourceCode", "source code"))
  }
  if (data.species.sourceCode === 'O') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "anotherSourceCodeForO", pageContent.rowTextOtherSourceCode, `${data.species.anotherSourceCodeForO || ""} ${otherSourceCodeValueText[data.species.anotherSourceCodeForO] || ""}`, "/sourceCode", "source code"))
  }

  if (data.permitType !== pt.ARTICLE_10) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "purposeCode", pageContent.rowTextPurposeCode, `${data.species.purposeCode || ""} ${purposeCodeValueText[data.species.purposeCode] || ""}`, "/purposeCode", "purpose code"))
  }
  summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "specimenType", pageContent.rowTextSpecimenType, specimenTypeValue[data.species.specimenType], "/specimenType", "specimen type"))
  if (data.species.specimenType !== "animalLiving") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ["isTradeTermCode", "tradeTermCode"], pageContent.rowTextTradeTermCode, data.species.isTradeTermCode ? `${data.species.tradeTermCode || ""} ${data.species.tradeTermCodeDesc || ""}` : pageContent.rowTextNotKnown, "/tradeTermCode", "trade term code"))
  }
  if (data.permitType === pt.ARTICLE_10) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "specimenOrigin", pageContent.rowTextA10SpecimenOrigin, a10SpecimenOriginValue[data.species.specimenOrigin], "/specimenOrigin", "specimen origin"))
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "useCertificateFor", pageContent.rowTextA10CertificatePurpose, a10CertificatePurposeValue[data.species.useCertificateFor], "/useCertificateFor", "use certificate for"))
  }
  summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ["uniqueIdentificationMarkType", "uniqueIdentificationMark"], pageContent.rowTextUniqueIdentificationMark, data.species.uniqueIdentificationMarkType === "unmarked" ? pageContent.rowTextSpecimenIsNotMarked : data.species.uniqueIdentificationMark, "/uniqueIdentificationMark", "unique identification mark"))
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "sex", pageContent.rowTextSex, sexDescription, "/describeLivingAnimal", "sex"))
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "dateOfBirth", pageContent.rowTextDateOfBirth, data.species.dateOfBirth.year ? getDateValue(data.species.dateOfBirth) : "", "/describeLivingAnimal", "date of birth"))
  }
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked' && [pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(data.permitType)) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "maleParentDetails", pageContent.rowTextMaleParentDetails, data.species.maleParentDetails, "/describeLivingAnimal", "male parent details"))
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "femaleParentDetails", pageContent.rowTextFemaleParentDetails, data.species.femaleParentDetails, "/describeLivingAnimal", "female parent details"))
  }
  if (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType !== 'unmarked') {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "specimenDescriptionLivingAnimal", pageContent.rowTextOtherDescription, data.species.specimenDescriptionLivingAnimal ? data.species.specimenDescriptionLivingAnimal : "", "/describeLivingAnimal", "describe the specimen"))
  }
  if (data.species.specimenType === "animalWorked" || data.species.specimenType === "plantWorked") {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ['createdDate-isExactDateUnknown', 'createdDate-approximateDate', 'createdDate-date'], pageContent.rowTextCreatedDate, data.species.createdDate?.isExactDateUnknown ? data.species.createdDate?.approximateDate : getDateValue(data.species.createdDate), "/createdDate", "created date"))
  }
  if (data.species.specimenType !== "animalLiving" || (data.species.specimenType === "animalLiving" && data.species.uniqueIdentificationMarkType === 'unmarked')) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "specimenDescriptionGeneric", pageContent.rowTextDescription, data.species.specimenDescriptionGeneric, "/descriptionGeneric", "description"))
  }
  if (data.permitType === pt.ARTICLE_10) {
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, ['acquiredDate-isExactDateUnknown', 'acquiredDate-approximateDate', 'acquiredDate-date'], pageContent.rowTextAcquiredDate, data.species.acquiredDate?.isExactDateUnknown ? data.species.acquiredDate?.approximateDate : getDateValue(data.species.acquiredDate), "/acquiredDate", "acquired date"))
    summaryListSpecimenDetailsRows.push(createSummaryListRow(summaryData, "a10CertificateNumber", pageContent.rowTextExistingArticle10Certificate, data.species.isA10CertificateNumberKnown ? data.species.a10CertificateNumber : pageContent.rowTextNotKnown, "/a10CertificateNumber", "existing a10 certificate"))
  }

  summaryListSections.push({
    key: 'summaryListSpecimenDetails',
    value: {
      id: "specimenDetails",
      name: "specimenDetails",
      classes: "govuk-!-margin-bottom-9",
      rows: summaryListSpecimenDetailsRows
    }
  })

  const summaryListImporterExporterDetailsRows = []
  if (importerExporterDetailsData.country) {
  //if (allowPageNavigation(data.submissionProgress, "importer-exporter" + data.applicationIndex)) {
    summaryListImporterExporterDetailsRows.push(createSummaryListRow(summaryData, 'importerExporter-country', pageContent.rowTextCountry, importerExporterDetailsData.countryDesc, "/importerExporterDetails", "country"))
  }
    summaryListImporterExporterDetailsRows.push(createSummaryListRow(summaryData, 'importerExporter-name', pageContent.rowTextFullName, importerExporterDetailsData.fullName, "/importerExporterDetails", "contact details"))
    summaryListImporterExporterDetailsRows.push(createSummaryListRow(summaryData, ['importerExporter-addressLine1', 'importerExporter-addressLine2', 'importerExporter-addressLine3', 'importerExporter-addressLine4', 'importerExporter-postcode'], pageContent.rowTextAddress, importerExporterAddressValue, "/importerExporterDetails", "contact details"))

    summaryListSections.push({
      key: 'summaryListImporterExporterDetails',
      value: {
        id: "importerExporterDetail",
        name: "importerExporterDetail",
        classes: "govuk-!-margin-bottom-9",
        rows: summaryListImporterExporterDetailsRows
      }
    })
  //}
  const summaryListRemarksRows = []
  //if (allowPageNavigation(data.submissionProgress, "additional-info" + data.applicationIndex)) {
    summaryListRemarksRows.push(createSummaryListRow(summaryData, "comments", pageContent.rowTextRemarks, data.comments, "/additionalInfo", "remarks"))

    if (enableInternalReference) {
      summaryListRemarksRows.push(createSummaryListRow(summaryData, "internalReference", pageContent.rowTextInternalReference, data.internalReference, "/additionalInfo", "internal reference"))
    }

    summaryListSections.push({
      key: 'summaryListRemarks',
      value: {
        id: "remarks",
        name: "remarks",
        classes: "govuk-!-margin-bottom-9",
        rows: summaryListRemarksRows
      }
    })
  //}
  summaryListSections.push({
    key: 'summaryListApplicantContactDetails',
    value: getContactDetails(summaryData, pageContent, applicantContactDetailsData, data.isAgent)
  })

  if (data.permitDetails) {

    const summaryListPermitDetailsExportOrReexportRows = []
    summaryListPermitDetailsExportOrReexportRows.push(createSummaryListRow(summaryData, 'exportOrReexportCountry', pageContent.rowTextCountry, exportOrReexportPermitDetailData.notApplicable ? pageContent.rowTextNotApplicable : exportOrReexportPermitDetailData.countryDesc, "/permitDetails", "permit details"))
    summaryListPermitDetailsExportOrReexportRows.push(createSummaryListRow(summaryData, 'exportOrReexportPermitNumber', pageContent.rowTextPermitNumber, exportOrReexportPermitDetailData.notApplicable ? pageContent.rowTextNotApplicable : exportOrReexportPermitDetailData.permitNumber, "/permitDetails", "permit details"))
    summaryListPermitDetailsExportOrReexportRows.push(createSummaryListRow(summaryData, 'exportOrReexportPermitIssueDate', pageContent.rowTextPermitIssueDate, exportOrReexportPermitDetailData.notApplicable ? pageContent.rowTextNotApplicable : getDateValue(exportOrReexportPermitDetailData.permitIssueDate), "/permitDetails", "permit details"))

    summaryListSections.push({
      key: 'summaryListExportOrReexportPermitDetails',
      value: {
        id: "permitDetails",
        name: "permitDetails",
        classes: "govuk-!-margin-bottom-9",
        rows: summaryListPermitDetailsExportOrReexportRows
      }
    })

    const summaryListPermitDetailsCountryOfOriginRows = []
    summaryListPermitDetailsCountryOfOriginRows.push(createSummaryListRow(summaryData, 'countryOfOrigin', pageContent.rowTextCountry, countryOfOriginPermitDetailData.notApplicable ? pageContent.rowTextNotApplicable : countryOfOriginPermitDetailData.countryDesc, "/permitDetails", "permit details"))
    summaryListPermitDetailsCountryOfOriginRows.push(createSummaryListRow(summaryData, 'countryOfOriginPermitNumber', pageContent.rowTextPermitNumber, countryOfOriginPermitDetailData.notApplicable ? pageContent.rowTextNotApplicable : countryOfOriginPermitDetailData.permitNumber, "/permitDetails", "permit details"))
    summaryListPermitDetailsCountryOfOriginRows.push(createSummaryListRow(summaryData, 'countryOfOriginPermitIssueDate', pageContent.rowTextPermitIssueDate, countryOfOriginPermitDetailData.notApplicable ? pageContent.rowTextNotApplicable : getDateValue(countryOfOriginPermitDetailData.permitIssueDate), "/permitDetails", "permit details"))

    summaryListSections.push({
      key: 'summaryListCountryOfOriginPermitDetails',
      value: {
        id: "permitDetails",
        name: "permitDetails",
        classes: "govuk-!-margin-bottom-9",
        rows: summaryListPermitDetailsCountryOfOriginRows
      }
    })

  }

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

  const showImporterExporterDetails = data.permitType !== pt.ARTICLE_10 && !(data.permitType === pt.REEXPORT && data.otherPermitTypeOption === pto.SEMI_COMPLETE)

  // const errorList = data.mandatoryFieldIssues.map(item => ({
  //   text: item.fieldDescription,
  //   href: `#${item.href}`
  // }))

  summaryListSections.forEach(item => applyBorderClasses(item.value))

  let errorList = null
  if (errors) {
    if (errors.mandatoryFieldIssues) {
      errorList = summaryListSections.flatMap(section =>
        section.value.rows
          .filter(row => row.error)
          .map(row => row.error)
      )
    } else {
      errorList = []
      const mergedErrorMessages = {
        ...commonContent.errorMessages,
        ...pageContent.errorMessages
      }
      const fields = []
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
  }

  const summaryListSectionsObject = summaryListSections.reduce((result, current) => {
    result[current.key] = current.value
    return result
  }, {})


  const model = {
    backLink,
    breadcrumbs: summaryType === 'view-submitted' || summaryType === 'copy-as-new' ? breadcrumbs : "",
    pageHeader,
    pageTitle,
    buttonText,
    showConfirmButton,
    formActionPage: `${currentPath}/${data.summaryType}/${data.applicationIndex}`,
    headerPermit: pageContent.headerPermit,
    headerContactDetails: data.isAgent ? headerApplicantContactDetails : pageContent.headerYourContactDetails,
    headerDeliveryAddress: pageContent.headerDeliveryAddress,
    headerSpecimenDetails: pageContent.headerSpecimenDetails,
    showImporterExporterDetails,
    headingImporterExporterDetails,
    headingPermitDetails: data.permitDetails && headingPermitDetails,
    headerCountryOfOriginPermitDetails: data.permitDetails && pageContent.headerCountryOfOriginPermitDetails,
    headerAdditionalInformation: pageContent.headerAdditionalInformation,
    returnToYourApplicationsLinkText: summaryType === 'view-submitted' ? pageContent.returnToYourApplicationsLinkText : "",
    returnToYourApplicationsLinkUrl: summaryType === 'view-submitted' ? `${urlPrefix}/my-submissions` : "",
    ...summaryListSectionsObject,
    // summaryListAboutThePermit: applyBorderClasses(summaryListAboutThePermit),
    // summaryListApplicantContactDetails: applyBorderClasses(summaryListApplicantContactDetails),
    // summaryListDeliveryAddress: applyBorderClasses(summaryListDeliveryAddress),
    // summaryListSpecimenDetails: applyBorderClasses(summaryListSpecimenDetails),
    // summaryListImporterExporterDetails: applyBorderClasses(summaryListImporterExporterDetails),
    // summaryListExportOrReexportPermitDetails: applyBorderClasses(summaryListExportOrReexportPermitDetails),
    // summaryListCountryOfOriginPermitDetails: applyBorderClasses(summaryListCountryOfOriginPermitDetails),
    // summaryListRemarks: applyBorderClasses(summaryListRemarks),

    errorSummaryTitle: "There are some mandatory fields that need to be completed before you can continue",
    errorList
  }
  return { ...commonContent, ...model }
}

function applyBorderClasses(summaryList) {
  if (summaryList) {

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

// function checkMandatoryFields(submission, applicationIndex) {
//   const mandatoryFieldIssues = []
//   const application = submission.applications[applicationIndex]

//   if (application.species.specimenType === "animalLiving" && application.species.uniqueIdentificationMarkType !== 'unmarked' && !application.species.dateOfBirth) {
//     mandatoryFieldIssues.push("dateOfBirth")
//   }

//   if (application.species.specimenType === "animalLiving" && application.species.uniqueIdentificationMarkType !== 'unmarked' && [pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(submission.permitType) && !application.species.maleParentDetails) {
//     mandatoryFieldIssues.push("maleParentDetails")
//   }

//   if (application.species.specimenType === "animalLiving" && application.species.uniqueIdentificationMarkType !== 'unmarked' && [pt.ARTICLE_10, pt.EXPORT, pt.POC, pt.TEC].includes(submission.permitType) && !application.species.femaleParentDetails) {
//     mandatoryFieldIssues.push("femaleParentDetails")
//   }

//   if (application.species.specimenType === "animalLiving" && application.species.uniqueIdentificationMarkType !== 'unmarked' && application.species.specimenDescriptionLivingAnimal?.length === 0) {
//     mandatoryFieldIssues.push("specimenDescriptionLivingAnimal")
//   }

//   //Do validation
//   return mandatoryFieldIssues
// }

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

  if (href && summaryData.summaryType !== 'view' && summaryData.summaryType !== 'view-submitted') {
    const actionItems = []
    if (summaryData.mandatoryFieldIssues.some(issue => fieldIdArray.includes(issue))) {
      actionItems.push({
        html: `<strong class="red-background govuk-tag">${pageContent.tagIncompleteText}</strong>`
      })
      error = {
        text: label,
        href: "#"
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
  if (!date || !date.month || !date.year) {
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

function getContactDetails(summaryData, pageContent, contactDetailsData, isAgent) {
  const summaryListContactDetailsRows = []

  const rowTextFullName = isAgent ? pageContent.rowTextFullNameAgent : pageContent.rowTextFullName
  summaryListContactDetailsRows.push(createSummaryListRow(summaryData, 'applicant-fullName', rowTextFullName, contactDetailsData.fullName, contactDetailsData.hrefPathSuffixContactDetails, "contact details"))
  if (!isAgent) {
    summaryListContactDetailsRows.push(createSummaryListRow(summaryData, 'applicant-businessName', pageContent.rowTextBusinessName, contactDetailsData.businessName, contactDetailsData.hrefPathSuffixContactDetails, "contact details"))
  }
  summaryListContactDetailsRows.push(createSummaryListRow(summaryData, 'applicant-email', pageContent.rowTextEmailAddress, contactDetailsData.email, contactDetailsData.hrefPathSuffixContactDetails, "contact details"))
  summaryListContactDetailsRows.push(createSummaryListRow(summaryData, 'applicant-address', pageContent.rowTextAddress, `${contactDetailsData.address.addressLine1} ${contactDetailsData.address.addressLine2} ${contactDetailsData.address.addressLine3} ${contactDetailsData.address.addressLine4} ${contactDetailsData.address.countryDesc} ${contactDetailsData.address.postcode}`, contactDetailsData.hrefPathSuffixAddress, "address"))

  return {
    id: "contactDetails",
    name: "contactDetails",
    classes: "govuk-!-margin-bottom-9",
    rows: summaryListContactDetailsRows
  }
}

function lookupTextContent(data, applicationRef) {
  let pageTitle = null
  let pageHeader = null
  let buttonText = null
  let showConfirmButton = true

  switch (data.summaryType) {
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
      pageTitle = data.applicationRef
      pageHeader = data.applicationRef
      buttonText = commonContent.copyAsNewApplicationButton
      showConfirmButton = data.isCurrentUsersApplication
      break
  }

  let headerApplicantContactDetails = null
  let headingImporterExporterDetails = null
  let headingPermitDetails = null
  let permitTypeValue = getPermitDescription(data.permitType, data.permitSubType)
  switch (data.permitType) {
    case pt.IMPORT:
      headerApplicantContactDetails = pageContent.headerImporterContactDetails
      headingImporterExporterDetails = pageContent.headerExportOrReexporterContactDetails
      headingPermitDetails = pageContent.headerExportOrReexportPermitDetails
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
      headingPermitDetails = pageContent.headerPermitDetailsFromExportIntoGreatBritain
      break
    case pt.ARTICLE_10:
      headerApplicantContactDetails = pageContent.headerArticle10ContactDetails
      headingPermitDetails = pageContent.headerPermitDetailsFromExportIntoGreatBritain
      break
  }

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
    U: pageContent.rowTextSourceCodeU
  };

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
    headingPermitDetails,
    permitTypeValue,
    purposeCodeValueText,
    sourceCodeValueText,
    otherSourceCodeValueText,
    specimenTypeValue,
    a10SpecimenOriginValue,
    a10CertificatePurposeValue
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
        case pt.IMPORT:
          pageContent = areYouSureText.importerContactDetails
          break
        case pt.EXPORT:
          pageContent = areYouSureText.exporterContactDetails
          break
        case pt.MIC:
        case pt.TEC:
        case pt.POC:
        case pt.REEXPORT:
          pageContent = areYouSureText.reexporterContactDetails
          break
        case pt.ARTICLE_10:
          pageContent = areYouSureText.article10ContactDetails
          break
      }
    } else if (changeType === "applicantAddress") {
      switch (data.permitType) {
        case pt.IMPORT:
          pageContent = areYouSureText.importerAddress
          break
        case pt.EXPORT:
          pageContent = areYouSureText.exporterAddress
          break
        case pt.MIC:
        case pt.TEC:
        case pt.POC:
        case pt.REEXPORT:
          pageContent = areYouSureText.reexporterAddress
          break
        case pt.ARTICLE_10:
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
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { summaryType, applicationIndex } = request.params
      let submission = getSubmission(request)


      //submission.applications[applicationIndex].importerExporterDetails.country = null//TODO REMOVE THIS AFTER DEV TESTS ARE COMPLETE


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


      let submissionProgress

      try {
        ({ submissionProgress: submissionProgress } = validateSubmission(submission, `${pageId}/${summaryType}/${applicationIndex}`, true))
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
        //clonedApplicationIndex: clonedApplicationIndex,
        //submissionRef: submission.submissionRef || clonedSubmissionRef,
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
        failAction: (request, h, error) => {
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
        return h.redirect(changeRouteData.startUrls[0])
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
        failAction: postFailAction
      },
      handler: async (request, h) => {
        const { summaryType, applicationIndex } = request.params
        const submission = getSubmission(request)

        const { submissionProgress } = validateSubmission(submission, null, true)

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
          return h.redirect(changeRouteData.startUrls[0])
        } else {
          return h.redirect(`${currentPath}/${summaryType}/${applicationIndex}`)
        }
      }
    }
  }
]

