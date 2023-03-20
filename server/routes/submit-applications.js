const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, validateSubmission } = require('../lib/submission')
const { NAME_REGEX } = require('../lib/regex-validation')
const textContent = require('../content/text-content')
const pageId = 'submit-applications'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/application-summary`
const nextPath = `${urlPrefix}/upload-supporting-documents`
const lodash = require('lodash')
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  
  let pageContent = null
  const submitApplicationsText = lodash.cloneDeep(textContent.submitApplications) //Need to clone the source of the text content so that the merge below doesn't affect other pages.

  switch (data.permitType) {
    case "import":
      pageContent = lodash.merge(submitApplicationsText.common, submitApplicationsText.importApplications)
      break
    case "export":
      pageContent = lodash.merge(submitApplicationsText.common, submitApplicationsText.importApplications) 
      break
    case "reexport":
      pageContent = lodash.merge(submitApplicationsText.common, submitApplicationsText.reexportApplications)
      break
    case "article10":
      pageContent = lodash.merge(submitApplicationsText.common, submitApplicationsText.article10Applications)
      break
  }

  const copyText = "<a href='https://www.gov.uk/guidance/cites-imports-and-exports'>pageContent.tableHeadCopy</a>"

  const model = {
    backLink: `${previousPath}/${data.applicationIndex}`,
    formActionPage: `${currentPath}/${data.applicationIndex}`,
    pageTitle: pageContent.defaultTitle,
    addAnotherSpeciesLinkText: pageContent.addAnotherSpeciesLinkText,
    addAnotherSpeciesUrl: `${urlPrefix}/permit-type`,
    applyForADifferentTypeOfPermitLinkText: pageContent.applyForADifferentTypeOfPermitLinkText,
    applyForADifferentTypeOfPermitUrl: `${urlPrefix}/species-name/${data.applicationIndex}`,
   
    submitApplicationsTable: {
        id: "submitApplications",
        name: "submitApplications",
        caption: pageContent.pageHeader,
        captionClasses: "govuk-table__caption--l",
        firstCellIsHeader: true,
        head: [
          {
            text: pageContent.tableHeadScientificName,
            classes: 'govuk-!-width-one-half'
          },
          {
            text: pageContent.tableHeadQuantity
          },
          {
            text: pageContent.tableHeadUnitOfMeasurement
          },
          {
            text: ""
          },
          {
            text: ""
          }
        ],
        rows: [
            [
              {
                text: "January"
              },
              {
                text: "5"
              },
              {
                text: "kg"
              },
              {
                    html: pageContent.tableHeadCopy,
              },
              {
                html: copyText
              }
             
            ],
            [
              {
                text: "February"
              },
              {
                text: "£55"
              },
              {
                html:  "9"
              },
              {
                actions: {
                    items: [
                      {
                        href: "#",
                        text: "Change",
                        visuallyHiddenText: "name"
                      }
                    ]
                  }
              },
              
              {
                attributes: {
                    href: "#",
                    text: pageContent.tableHeadCopy,
                }
              },
            ],
            [
              {
                text: "March"
              },
              {
                text: "£125"
              }
            ]
          ]
      }
   

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
      const applications= submission.applications

    //   try {
    //     validateSubmission(submission, `${pageId}/${request.params.applicationIndex}`)
    //   } catch (err) {
    //     console.log(err)
    //     return h.redirect(`${invalidSubmissionPath}/`)
    //   }

      const pageData = {
        applicationIndex: applicationIndex,
        permitType: submission.permitType,
        applications : applications
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
        
        failAction: (request, h, err) => {
          const { applicationIndex } = request.params
          const submission = getSubmission(request)
          const pageData = {
            applicationIndex: applicationIndex,
            permitType: submission.permitType,
            sex: submission.applications[applicationIndex].species.sex,
            ...request.payload
          }
          return h.view(pageId, createModel(err, pageData)).takeover()
        }
      },
      handler: async (request, h) => {
        const { applicationIndex } = request.params
        const submission = getSubmission(request)

        const importerExporterDetails = {
          country: request.payload.country.trim(),
          name: request.payload.name.trim(),
          addressLine1: request.payload.addressLine1.trim(),
          addressLine2: request.payload.addressLine2.trim(),
          addressLine3: request.payload.addressLine3.trim(),
          addressLine4: request.payload.addressLine4.trim(),
          postcode: request.payload.postcode.trim()
        }

        submission.applications[applicationIndex].importerExporterDetails = importerExporterDetails

        try {
          mergeSubmission(request, { applications: submission.applications }, `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }

        if (submission.permitType === 'export') {
          return h.redirect(`${nextPathComments}/${applicationIndex}`)
        } else {
          return h.redirect(`${nextPathPermitDetails}/${applicationIndex}`)
        }
      }
    }
  }
]
