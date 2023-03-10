const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const { setChangeRoute, clearChangeRoute, changeTypes } = require("../lib/change-route")
const textContent = require("../content/text-content")
const pageId = "application-summary"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/comments`
const nextPath = `${urlPrefix}/your-applications-pre-submission` //TO DO
const invalidSubmissionPath = urlPrefix
const summaryTypes = ['check', 'view', 'copy']


function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.applicationSummary
  const hrefPrefix =  "../../application-summary/change/" + data.applicationIndex

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

  let purposeCodeValueText = null
  switch (data.species.purposeCode) {
    case "B":
      purposeCodeValueText = pageContent.rowTextPurposeCodeB
      break
    case "E":
      purposeCodeValueText = pageContent.rowTextPurposeCodeE
      break
    case "G":
      purposeCodeValueText =  pageContent.rowTextPurposeCodeG
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
    case "U":
      sourceCodeValueText = data.species.enterAReason
      break
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
        country: data.applicant.address.country
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
        country: data.agent.address.country
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
      country: data.applicant.address.country
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
    country: data.delivery.address.country
  }

  let unitsOfMeasurementValue = null
  if (data.species.unitOfMeasurement && data.species.unitOfMeasurement === "noOfSpecimens") {
    unitsOfMeasurementValue = pageContent.rowTextUnitsOfMeasurementNoOfSpecimens
  } else if (data.species.unitOfMeasurement && data.species.unitOfMeasurement === "noOfPiecesOrParts") {
    unitsOfMeasurementValue = pageContent.rowTextUnitsOfMeasurementNoOfPiecesOrParts
  } else {
    unitsOfMeasurementValue = data.species?.unitOfMeasurement
  }

  const exportOrReexportPermitDetailData = {
    notApplicable: data.permitDetails?.isExportOrReexportNotApplicable,
    country : data.permitDetails?.exportOrReexportCountry,
    permitNumber: data.permitDetails?.exportOrReexportPermitNumber,
    permitIssueDate: {
      day: data.permitDetails?.exportOrReexportPermitIssueDate.day,
      month: data.permitDetails?.exportOrReexportPermitIssueDate.month,
      year: data.permitDetails?.exportOrReexportPermitIssueDate.year
    }
  }

  const countryOfOriginPermitDetailData = {
    notApplicable: data.permitDetails?.isCountryOfOriginNotApplicable,
    country : data.permitDetails?.countryOfOrigin,
    permitNumber: data.permitDetails?.countryOfOriginPermitNumber,
    permitIssueDate: {
      day: data.permitDetails?.countryOfOriginPermitIssueDate.day,
      month: data.permitDetails?.countryOfOriginPermitIssueDate.month,
      year: data.permitDetails?.countryOfOriginPermitIssueDate.year
    }
  }

  const importerExporterDetailsData = {
    isImporterExporterDetails: true,
    fullName: data.importerExporterDetails.name,
    country: data.permitType !== "import" ? data.importerExporterDetails.country : "",
    address: {
      addressLine1: data.importerExporterDetails.addressLine1,
      addressLine2: data.importerExporterDetails.addressLine2,
      addressLine3: data.importerExporterDetails.addressLine3 ? data.importerExporterDetails.addressLine3 : "",
      addressLine4: data.importerExporterDetails.addressLine4 ? data.importerExporterDetails.addressLine4 : "",
      postcode: data.importerExporterDetails.postcode,
    }
  }
 

  const summaryListAboutThePermit = {
    id: "permitType",
    name: "permitType",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      {
        classes: "govuk-summary-list__row-border-top",
        key: {
          text: pageContent.rowTextPermitType
        },
        value: {
          text: data.permitType
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/permitType",
              text: "Change",
              visuallyHiddenText: "permit type"
            },
          ]
        }
      }
    ]
  }

  const summaryListDeliveryAddress = {
    id: "deliveryAddress",
    name: "deliveryAddress",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      {
        classes: "govuk-summary-list__row-border-top",
        key: {
          text: pageContent.rowTextAddress
        },
        value: {
          text: `${deliveryAddressData.addressLine1} ${deliveryAddressData.addressLine2} ${deliveryAddressData.addressLine3} ${deliveryAddressData.addressLine4} ${deliveryAddressData.country} ${deliveryAddressData.postcode}`
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/deliveryAddress",
              text: "Change",
              visuallyHiddenText: "delivery address"
            }
          ]
        }
      }
    ]
  }

  console.log("Data", data)

  const summaryListSpecimenDetails = {
    id: "specimenDetails",
    name: "specimenDetails",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      {
        classes: "govuk-summary-list__row-border-top govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextScientificName
        },
        value: {
          text: data.species.speciesName
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/speciesName",
              text: "Change",
              visuallyHiddenText: "species name"
            }
          ]
        }
      },
     {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextQuantity
        },
        value: {
          text: data.species.quantity
        },
      },
      (data.species.specimenType !== "animalLiving") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextUnitOfMeasurement
        },
        value: {
          text: unitsOfMeasurementValue
        },
      },
      {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextSourceCode
        },
        value: {
          text: `${data.species.sourceCode} ${sourceCodeValueText}`
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/sourceCode",
              text: "Change",
              visuallyHiddenText: "source code"
            }
          ]
        }
      },
      (data.permitType !== "article10") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextPurposeCode
        },
        value: {
          text: `${data.species.purposeCode} ${purposeCodeValueText}`
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/purposeCode",
              text: "Change",
              visuallyHiddenText: "purpose Code"
            }
          ]
        }
      },
      {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextTradeTermCode
        },
        value: {
          text: data.species.isTradeTermCode ? data.species.tradeTermCode : commonContent.radioOptionNo
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/tradeTermCode",
              text: "Change",
              visuallyHiddenText: "trade term code"
            }
          ]
        }
      },
      (data.permitType === "article10") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextA10CertificatePurpose
        },
        value: {
          text: a10CertificatePurposeValue
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/useCertificateFor",
              text: "Change",
              visuallyHiddenText: "use certificate for"
            }
          ]
        }
      },
      {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextUniqueIdentificationMark
        },
        value: {
          text: data.species.uniqueIdentificationMark ? data.species.uniqueIdentificationMark : pageContent.rowTextSpecimenIsNotMarked
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/uniqueIdentificationMark",
              text: "Change",
              visuallyHiddenText: "unique identification mark"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && (data.species.uniqueIdentificationMarkType !== 'unmarked') && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextSex
        },
        value: {
          text: data.species.sex
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/describeLivingAnimal",
              text: "Change",
              visuallyHiddenText: "sex"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && (data.species.uniqueIdentificationMarkType !== 'unmarked') && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextDateOfBirth
        },
        value: {
          text: data.species.dateOfBirth.year ? getDateValue(data.species.dateOfBirth) : ""
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/describeLivingAnimal",
              text: "Change",
              visuallyHiddenText: "date of birth"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && (data.species.uniqueIdentificationMarkType !== 'unmarked') && (data.permitType === "article10") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextParentDetails
        },
        value: {
          text: data.species.parentDetails
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/describeLivingAnimal",
              text: "Change",
              visuallyHiddenText: "parent details"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && (data.species.uniqueIdentificationMarkType !== 'unmarked') && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextOtherDescription
        },
        value: {
          text: data.species.specimenDescriptionLivingAnimal ? data.species.specimenDescriptionLivingAnimal : ""
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/describeLivingAnimal",
              text: "Change",
              visuallyHiddenText: "other description"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && (data.species.uniqueIdentificationMarkType === "unmarked") && {
        key: {
          text: pageContent.rowTextUnmarkedSpecimens
        },
        value: {
          text: data.species.numberOfUnmarkedSpecimens
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/unmarkedSpecimens",
              text: "Change",
              visuallyHiddenText: "unmarked specimens"
            }
          ]
        }
      },
      (data.species.specimenType === "animalWorked" || data.species.specimenType === "plantWorked") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextCreatedDate
        },
        value: {
          text: data.species.createdDate.isExactDateUnknown ? data.species.createdDate.approximateDate : getDateValue(data.species.createdDate)
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/createdDate",
              text: "Change",
              visuallyHiddenText: "created date"
            }
          ]
        }
      },
      (data.species.specimenType !== "animalLiving") && {
        key: {
          text: pageContent.rowTextDescription
        },
        value: {
          text: data.species.specimenDescriptionGeneric
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/descriptionGeneric",
              text: "Change",
              visuallyHiddenText: "description"
            }
          ]
        }
      },
      (data.permitType === "article10") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextAcquiredDate
        },
        value: {
          text: data.species.acquiredDate.isExactDateUnknown ? data.species.acquiredDate.approximateDate : getDateValue(data.species.acquiredDate)
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/acquiredDate",
              text: "Change",
              visuallyHiddenText: "acquired date"
            }
          ]
        }
      },
      (data.permitType === "article10") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextExistingArticle10Certificate
        },
        value: {
          text: data.species.isA10CertificateNumberKnown ? data.species.a10CertificateNumber : commonContent.radioOptionNo
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/a10CertificateNumber",
              text: "Change",
              visuallyHiddenText: "existing article 10 certificate"
            }
          ]
        }
      }
    ]
  }

 
  const summaryListImporterExporterDetails = {
    id: "importerExporterDetail",
    name: "importerExporterDetail",
    rows: [
      (importerExporterDetailsData.country) && {
        classes: "govuk-summary-list__row-border-top govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextCountry
        },
        value: {
          text: importerExporterDetailsData.country
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/importerExporterDetails",
              text: "Change",
              visuallyHiddenText: "country"
            }
          ]
        }
      },
      {
        classes: "govuk-summary-list__row-border-top govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextFullName
        },
        value: {
          text: importerExporterDetailsData.fullName
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/importerExporterDetails",
              text: !importerExporterDetailsData.country ? "Change" : "",
              visuallyHiddenText: "contact details"
            }
          ]
        }
      },
      {
        key: {
          text: pageContent.rowTextAddress
        },
        value: {
          text: `${importerExporterDetailsData.address.addressLine1} ${importerExporterDetailsData.address.addressLine2} ${importerExporterDetailsData.address.addressLine3} ${importerExporterDetailsData.address.addressLine4} ${importerExporterDetailsData.address.postcode}`
        }
      }
    ]
  }
 

  
   const summaryListRemarks = {
    id: "remarks",
    name: "remarks",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      {
        classes: "govuk-summary-list__row-border-top",
        key: {
          text: pageContent.headerRemarks
        },
        value: {
          text: data.comments
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/comments",
              text: "Change",
              visuallyHiddenText: "remarks"
            }
          ]
        }
      }
    ]
  }




  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    pageHeader: pageContent.pageHeader,
    formActionPage: `${currentPath}/${data.summaryType}/${data.applicationIndex}`,
    pageTitle: pageContent.defaultTitle,
    headerPermit: pageContent.headerPermit,
    headerYourContactDetails: pageContent.headerYourContactDetails,
    headerApplicantContactDetails: data.isAgent ? headerApplicantContactDetails : "",
    headerDeliveryAddress: pageContent.headerDeliveryAddress,
    headerSpecimenDetails: pageContent.headerSpecimenDetails,
    headingImporterExporterDetails: headingImporterExporterDetails,
    headingPermitDetails: headingPermitDetails,
    headerCountryOfOriginPermitDetails: pageContent.headerCountryOfOriginPermitDetails,
    headerRemarks: pageContent.headerRemarks,

    summaryListAboutThePermit: summaryListAboutThePermit,

    summaryListYourContactDetails: getContactDetails (pageContent, yourContactDetailsData, hrefPrefix),

    summaryListApplicantContactDetails: data.isAgent && getContactDetails(pageContent, agentApplicantContactDetailsData, hrefPrefix),
  
    summaryListDeliveryAddress : summaryListDeliveryAddress,

    summaryListSpecimenDetails: summaryListSpecimenDetails,

    summaryListImporterExporterDetails : data.permitType !== "article10" && summaryListImporterExporterDetails,
    
    summaryListExportOrReexportPermitDetails :  data.permitDetails && getPermitDetails(pageContent, exportOrReexportPermitDetailData, hrefPrefix),

    summaryListCountryOfOriginPermitDetails : data.permitDetails && getPermitDetails(pageContent, countryOfOriginPermitDetailData, hrefPrefix),

    summaryListRemarks: summaryListRemarks,
  }
  return { ...commonContent, ...model }
}

function getDateValue(date) {
  if (date.day) {
    return `${date.day}.${date.month}.${date.year}`
  } else {
    return `${date.month}.${date.year}`
  }
}

function getContactDetails(pageContent, contactDetailsData, hrefPrefix) {
  const summaryListContactDetails = {
    id: "contactDetails",
    name: "contactDetails",
    rows: [
      {
        classes: "govuk-summary-list__row-border-top govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextFullName
        },
        value: {
          text: contactDetailsData.fullName
        },
        actions: {
          items: [
            {
              href: hrefPrefix + contactDetailsData.hrefPathSuffixContactDetails,
              text: "Change",
              visuallyHiddenText: "contact details"
            }
          ]
        }
      },
     {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextBusinessName
        },
        value: {
          text: contactDetailsData.businessName
        }
      },
     {
        key: {
          text: pageContent.rowTextEmailAddress
        },
        value: {
          text: contactDetailsData.email
        }
      },
      {
        key: {
          text: pageContent.rowTextAddress
        },
        value: {
          text: `${contactDetailsData.address.addressLine1} ${contactDetailsData.address.addressLine2} ${contactDetailsData.address.addressLine3} ${contactDetailsData.address.addressLine4} ${contactDetailsData.address.country} ${contactDetailsData.address.postcode}`
        },
        actions: {
          items: [
            {
              href: hrefPrefix + contactDetailsData.hrefPathSuffixAddress,
              text:  "Change",
              visuallyHiddenText: "address"
            }
          ]
        }
      }
    ]
  }
  return summaryListContactDetails
}

function getPermitDetails(pageContent, permitDetailsData, hrefPrefix) {
  const summaryListPermitDetails = {
    id: "permitDetails",
    name: "permitDetails",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      {
        classes: "govuk-summary-list__row-border-top govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextCountry
        },
        value: {
          text: permitDetailsData.notApplicable ? pageContent.rowTextNotApplicable : permitDetailsData.country 
        },
        actions: {
          items: [
            {
              href: hrefPrefix + "/permitDetails",
              text: "Change",
              visuallyHiddenText: "permit details"
            }
          ]
        }
      },
      {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextPermitNumber
        },
        value: {
          text: permitDetailsData.notApplicable ? pageContent.rowTextNotApplicable : permitDetailsData.permitNumber
        },
      },
      {
        key: {
          text: pageContent.rowTextPermitIssueDate
        },
        value: {
          text: permitDetailsData.notApplicable ? pageContent.rowTextNotApplicable : getDateValue(permitDetailsData.permitIssueDate)
        },
      },
    ]
  }
  return summaryListPermitDetails
 }




module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{summaryType}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          summaryType: Joi.string().valid(...summaryTypes),
          applicationIndex: Joi.
          
          number().required()
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { summaryType, applicationIndex } = request.params
      const submission = getSubmission(request)
      clearChangeRoute(request)

      try {
        validateSubmission(
          submission,
          `${pageId}/${request.params.summaryType}/${request.params.applicationIndex}`
        )
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

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
      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "GET",
    path: `${currentPath}/change/{applicationIndex}/{changeType}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required(),
          changeType: Joi.string().valid(...changeTypes),
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { applicationIndex, changeType } = request.params

      const changeRouteData = setChangeRoute(request, changeType, applicationIndex)

      return h.redirect(changeRouteData.startUrl)
    }
  },
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
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        return h.redirect(nextPath)
      }
    }
  }
]
