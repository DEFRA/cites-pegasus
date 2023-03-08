const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  getSubmission,
  mergeSubmission,
  validateSubmission
} = require("../lib/submission")
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

  let headerApplicantContactDetails = null
  let headingImporterExporterDetails = null
  let headingPermitDetails = null

  console.log("data", data)

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

  

  let yourContactDetailsData = null

  if (!data.isAgent) {
    yourContactDetailsData = {
      isImporterExporterDetails: false,
      fullName: data.applicant.fullName,
      businessName: data.applicant.businessName,
      email: data.applicant.email,
      address: {
        addressLine1: data.applicant.address.addressLine1,
        addressLine2: data.applicant.address.addressLine2,
        addressLine3: data.applicant.address.addressLine3 ? data.applicant.address.addressLine3  : "",
        addressLine4: data.applicant.address.addressLine4 ? data.applicant.address.addressLine4  : "",
        postcode: data.applicant.address.postcode,
        country: data.applicant.address.country
      }
    }
  } else {
    yourContactDetailsData = {
      isImporterExporterDetails: false,
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
      }
    }
  }

  const agentApplicantContactDetailsData = {
    isImporterExporterDetails: false,
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
    }
  }

  const importerExporterDetailsData = {
    isImporterExporterDetails: true,
    fullName: data.importerExporterDetails.name,
    country: data.permitType !== "import" ?  data.importerExporterDetails.country : "",
    address: {
      addressLine1: data.importerExporterDetails.addressLine1,
      addressLine2: data.importerExporterDetails.addressLine2,
      addressLine3: data.importerExporterDetails.addressLine3 ? data.importerExporterDetails.addressLine3 : "",
      addressLine4: data.importerExporterDetails.addressLine4 ? data.importerExporterDetails.addressLine4 : "",
      postcode: data.importerExporterDetails.postcode,
      country : ""
    }
  }

  

  const deliveryAddressData = {
    addressLine1: data.delivery.address.addressLine1,
    addressLine2: data.delivery.address.addressLine2,
    addressLine3: data.delivery.address.addressLine3 ? data.delivery.address.addressLine3 : "",
    addressLine4: data.delivery.address.addressLine4 ? data.delivery.address.addressLine4 : "",
    postcode: data.delivery.address.postcode,
    country: data.delivery.address.country
  }

  console.log ("deliveryAddressData", deliveryAddressData)

  function getDateValue(date){
    if(date.day){
      return `${date.day}.${date.month}.${date.year}`
    } else {
      return `${date.month}.${date.year}`
    }
  }

  let unitsOfMeasurementValue = null
  if (data.species.unitOfMeasurement === "noOfSpecimens") {
    unitsOfMeasurementValue = pageContent.rowTextUnitsOfMeasurementNoOfSpecimens
  } else if (data.species.unitOfMeasurement === "noOfPiecesOrParts") {
    unitsOfMeasurementValue = pageContent.rowTextUnitsOfMeasurementNoOfPiecesOrParts
  } else {
    unitsOfMeasurementValue = data.species.unitOfMeasurement
  }



 const summaryListAboutThePermit = {
    id: "permitType",
    name: "permitType",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      {
        classes: "govuk-heading-m",
        key: {
          text: pageContent.headerPermit
        }
      },
      {
        key: {
          text: pageContent.rowTextPermitType
        },
        value: {
          text: data.permitType
        },
        actions: {
          items: [
            {
              href: "#",
              text: "Change",
              visuallyHiddenText: "permit type"
            }
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
        classes: "govuk-heading-m",
        key: {
          text: pageContent.headerDeliveryAddress
        }
      },
      {
        key: {
          text: pageContent.rowTextAddress
        },
        value: {
            text: `${deliveryAddressData.addressLine1} ${deliveryAddressData.addressLine2} ${deliveryAddressData.addressLine3} ${deliveryAddressData.addressLine4} ${deliveryAddressData.country} ${deliveryAddressData.postcode}`
        },
        actions: {
          items: [
            {
              href: "#",
              text: "Change",
              visuallyHiddenText: "delivery address"
            }
          ]
        }
      }
    ]
  }
  console.log("contactDetailsData", data)

  function getContactDetails(header, pageContent, contactDetailsData) {
    const summaryListContactDetails = {
      id: "contactDetails",
      name: "contactDetails",
      rows: [
       {
          classes: "govuk-heading-m",
          key: {
            text: header
          }
        },
        (contactDetailsData.country) && {
          classes: "govuk-summary-list__row--no-border",
          key: {
            text: pageContent.rowTextCountry
          },
          value: {
            text: contactDetailsData.country
          },
          actions: {
            items: [
              {
                href: "#",
                text: "Change",
                visuallyHiddenText: "country"
              }
            ]
          }
        },
        {
          classes: "govuk-summary-list__row--no-border",
          key: {
            text: pageContent.rowTextFullName
          },
          value: {
            text: contactDetailsData.fullName
          },
          actions: {
            items: [
              {
                href: "#",
                text: !contactDetailsData.country ? "Change" : "",
                visuallyHiddenText: "contact details"
              }
            ]
          }
        },
        (!contactDetailsData.isImporterExporterDetails) && {
          classes: "govuk-summary-list__row--no-border",
          key: {
            text: pageContent.rowTextBusinessName
          },
          value: {
            text: contactDetailsData.businessName
          }
        },
        (!contactDetailsData.isImporterExporterDetails) && {
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
                href: "#",
                text: !contactDetailsData.country ? "Change" : "",
                visuallyHiddenText: "address"
              }
            ]
          }
        }
      ]
    }
    return summaryListContactDetails
  }

  const summaryListSpecimenDetails  = {
    id: "specimenDetails",
    name: "specimenDetails",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      {
        classes: "govuk-heading-m",
        key: {
          text: pageContent.headerSpecimenDetails
        }
      },
      {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextScientificName
        },
        value: {
          text: data.species.speciesName
        },
        actions: {
          items: [
            {
              href: "#",
              text: "Change",
              visuallyHiddenText: "species name"
            }
          ]
        }
      },
      (data.species.specimenType !== "animalLiving") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextQuantity
        },
        value: {
          text: `${data.species.quantity} ${unitsOfMeasurementValue}`
        },
      },
      {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextSourceCode
        },
        value: {
          text: data.species.sourceCode
        },
        actions: {
          items: [
            {
              href: "#",
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
          text: data.species.purposeCode
        },
        actions: {
          items: [
            {
              href: "#",
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
              href: "#",
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
              href: "#",
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
              href: "#",
              text: "Change",
              visuallyHiddenText: "unique identification mark"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && {
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
              href: "#",
              text: "Change",
              visuallyHiddenText: "sex"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && {
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
              href: "#",
              text: "Change",
              visuallyHiddenText: "date of birth"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") &&  (data.permitType === "article10") && {
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
              href: "#",
              text: "Change",
              visuallyHiddenText: "parent details"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && {
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
              href: "#",
              text: "Change",
              visuallyHiddenText: "description"
            }
          ]
        }
      },
      (data.species.specimenType === "animalLiving") && (data.species.uniqueIdentificationMarkType === "unmarked") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextUnmarkedSpecimens
        },
        value: {
          text: data.species.numberOfUnmarkedSpecimens
        },
        actions: {
          items: [
            {
              href: "#",
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
              href: "#",
              text: "Change",
              visuallyHiddenText: "created date"
            }
          ]
        }
      },
      (data.species.specimenType !== "animalLiving") && {
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: pageContent.rowTextDescription
        },
        value: {
          text: data.species.specimenDescriptionGeneric
        },
        actions: {
          items: [
            {
              href: "#",
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
              href: "#",
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
              href: "#",
              text: "Change",
              visuallyHiddenText: "existing article 10 certificate"
            }
          ]
        }
      }
    ]
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
 

  function getPermitDetails(header, pageContent, permitDetailsData) {
    const summaryListPermitDetails = {
      id: "permitDetails",
      name: "permitDetails",
      classes: "govuk-!-margin-bottom-9",
      rows: [
        {
          classes: "govuk-heading-m",
          key: {
            text: header
          }
        },
        {
          classes: "govuk-summary-list__row--no-border",
          key: {
            text: pageContent.rowTextCountry
          },
          value: {
            text: permitDetailsData.notApplicable ? pageContent.rowTextNotApplicable : permitDetailsData.country 
          },
          actions: {
            items: [
              {
                href: "#",
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


   const summaryListRemarks = {
    id: "permitType",
    name: "permitType",
    classes: "govuk-!-margin-bottom-9",
    rows: [
      {
        classes: "govuk-heading-m",
        key: {
          text: pageContent.headerRemarks
        }
      },
      {
        key: {
          text: pageContent.headerRemarks
        },
        value: {
          text: data.comments
        },
        actions: {
          items: [
            {
              href: "#",
              text: "Change",
              visuallyHiddenText: "permit type"
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

    summaryListAboutThePermit: summaryListAboutThePermit,

    summaryListYourContactDetails: getContactDetails(pageContent.headerYourContactDetails, pageContent, yourContactDetailsData),

    summaryListApplicantContactDetails: data.isAgent && getContactDetails(headerApplicantContactDetails, pageContent, agentApplicantContactDetailsData),
  
    summaryListDeliveryAddress : summaryListDeliveryAddress,

    summaryListSpecimenDetails : summaryListSpecimenDetails,

    summaryListImporterExporterDetails : data.permitType !== "article10" && getContactDetails(headingImporterExporterDetails, pageContent, importerExporterDetailsData),

    summaryListExportOrReexportPermitDetails :  data.permitDetails && getPermitDetails(headingPermitDetails, pageContent, exportOrReexportPermitDetailData),

    summaryListCountryOfOriginPermitDetails : data.permitDetails && getPermitDetails(pageContent.headerCountryOfOriginPermitDetails, pageContent, countryOfOriginPermitDetailData),

    summaryListRemarks: summaryListRemarks,


  }

  return { ...commonContent, ...model }
}

// (data.permitType !== "export" || !data.species.isEverImportedExported)

module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{summaryType}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          summaryType: Joi.string().valid(...summaryTypes),
          applicationIndex: Joi.number().required()
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const {summaryType, applicationIndex } = request.params
      const submission = getSubmission(request)

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
        ...submission[request.params.summaryType] 
      }

      return h.view(pageId, createModel(null, pageData))
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
          const {summaryType, applicationIndex } = request.params
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
            ...submission[request.params.summaryType] 
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
