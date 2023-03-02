const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const {
  getSubmission,
  mergeSubmission,
  validateSubmission
} = require("../lib/submission")
const textContent = require("../content/text-content")
const pageId = "check-answers"
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/comments`
const nextPath = `${urlPrefix}/your-applications-pre-submission` //TO DO
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.checkAnswers

  let headerApplicantContactDetails = null
  let headingExporterOrReexporterContactDetails = null
  let headingPermitDetails = null

  console.log("headerPermit", pageContent.headerPermit)

  switch (data.permitType) {
    case "import":
      headerApplicantContactDetails = pageContent.headerImporterContactDetails
      headingExporterOrReexporterContactDetails = pageContent.headerExportOrReexporterContactDetails
      headingPermitDetails = pageContent.headerExportOrReexportPermitDetails
      break
    case "export":
      headerApplicantContactDetails = pageContent.headerExporterContactDetails
      headingExporterOrReexporterContactDetails = pageContent.headerImporterContactDetails
      break
    case "reexport":
      headerApplicantContactDetails = pageContent.headerReexporterContactDetails
      headingExporterOrReexporterContactDetails = pageContent.headerImporterContactDetails
      headingPermitDetails =
        pageContent.headerPermitDetailsFromExportIntoGreatBritain
      break
    case "article10":
      headerApplicantContactDetails = pageContent.headerArticle10ContactDetails
      headingPermitDetails = pageContent.headerPermitDetailsFromExportIntoGreatBritain
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
        addressLine3: data.applicant.address.addressLine3 ? data.applicant.address.addressLine3  : "",
        addressLine4: data.applicant.address.addressLine4 ? data.applicant.address.addressLine4  : "",
        postcode: data.applicant.address.postcode,
        country: data.applicant.address.country
      }
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
      }
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
              visuallyHiddenText: "Permit type"
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
              visuallyHiddenText: "Delivery Address"
            }
          ]
        }
      }
    ]
  }

  function getSummaryListContactDetails(header, pageContent, contactDetailsData) {
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
                text: "Change",
                visuallyHiddenText: "Contact Details"
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
                href: "#",
                text: "Change",
                visuallyHiddenText: "Address"
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
              visuallyHiddenText: "Permit type"
            }
          ]
        }
      }
    ]
  }
  

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    pageHeader: pageContent.pageHeader,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    pageTitle: pageContent.defaultTitle,

    summaryListAboutThePermit: summaryListAboutThePermit,

    summaryListYourContactDetails: getSummaryListContactDetails(pageContent.headerYourContactDetails, pageContent, yourContactDetailsData),

    summaryListApplicantContactDetails: data.isAgent && getSummaryListContactDetails(headerApplicantContactDetails, pageContent, agentApplicantContactDetailsData),
  
    summaryListDeliveryAddress : summaryListDeliveryAddress,

    summaryListDeliveryAddress : summaryListSpecimenDetails,



}

  return { ...commonContent, ...model }
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        failAction: (request, h, error) => {
          console.log(error)
        }
      }
    },
    handler: async (request, h) => {
      const { applicationIndex } = request.params
      const submission = getSubmission(request)

      try {
        validateSubmission(
          submission,
          `${pageId}/${request.params.applicationIndex}`
        )
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const pageData = {
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        isAgent: submission.isAgent,
        applicant: submission.applicant,
        agent: submission?.agent,
        delivery: submission?.delivery

      }

      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}`,
    options: {
      validate: {
        params: Joi.object({
          applicationIndex: Joi.number().required()
        }),
        options: { abortEarly: false },
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const pageData = {
            applicationIndex: applicationIndex,
            permitType: submission.permitType
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
