const Joi = require("joi")
const urlPrefix = require("../../config/config").urlPrefix
const { findErrorList, getFieldError } = require("../lib/helper-functions")
const { getSubmission, mergeSubmission, validateSubmission } = require("../lib/submission")
const nunjucks = require("nunjucks")
const textContent = require("../content/text-content")
const pageId = "my-submissions"
const currentPath = `${urlPrefix}/${pageId}`
const nextPathPermitType = `${urlPrefix}/permit-type`
const invalidSubmissionPath = urlPrefix

function createModel(errors, data) {
  const commonContent = textContent.common
  const pageContent = textContent.mySubmissions

  var renderString = "{% from 'govuk/components/button/macro.njk' import govukButton %} \n {{govukButton(input)}}"

  nunjucks.configure(['node_modules/govuk-frontend/'], { autoescape: true, watch: false })

  const searchButton = nunjucks.renderString(renderString, {
    input: {
      id: "searchButton",
      name: "searchButton",
      type: "submit",
    classes: "govuk-button--search",
     
      attributes: {
        formAction: currentPath
      }
    }
  })

 
  
  
  const model = {
    backLink: currentPath,
    formActionPage: currentPath,
    pageTitle: pageContent.defaultTitle,
    pageHeader: pageContent.pageHeader,
    clearSearchLinkText: pageContent.linkTextClearSearch,
    clearSearchUrl: currentPath,
    buttonStartNewApplication: pageContent.buttonStartNewApplication,
   

    inputSearch: {
      id: "search",
      name: "search",
      classes: "govuk-grid-column-one-half",
      inputmode: "search",
      label: {
        text: pageContent.inputLabelSearch
      },
      suffix: {
        classes:"govuk-input__suffix--search",
        html: searchButton
      },
     
      ...(data.searchValue
        ? { value: data.searchValue }
        : {}),
    },
   
    // checkboxExportOrReexportNotApplicable: {
    //   idPrefix: "isExportOrReexportNotApplicable",
    //   name: "isExportOrReexportNotApplicable",
    //   items: [
    //     {
    //       value: true,
    //       text: pageContent.checkboxLabelNotApplicable,
    //       checked: data.isExportOrReexportNotApplicable
    //     }
    //   ]
    // },

   
    
   
  }
  return { ...commonContent, ...model }
}


module.exports = [
  //GET for my applications page
  {
    method: "GET",
    path: currentPath,
    handler: async (request, h) => {
      const submission = getSubmission(request)

      try {
        validateSubmission(submission, pageId)
      } catch (err) {
        console.log(err)
        return h.redirect(`${invalidSubmissionPath}/`)
      }

      const pageData = {
        submission: submission
      }
      return h.view(pageId, createModel(null, pageData))
    }
  },
  //POST for start new application button
  {
    method: "POST",
    path: currentPath,
    options: {
      validate: {
        failAction: (request, h, error) => {
          console.log(error)
        }
      },
      handler: async (request, h) => {
        return h.redirect(nextPathPermitType)
      }
    }
  },
  {
    method: "POST",
    path: `${currentPath}/{applicationIndex}`,
   
      handler: async (request, h) => {
       
        const submission = getSubmission(request)
        try {
          mergeSubmission(
            request,
            { applications: submission.applications },
            `${pageId}/${applicationIndex}`
          )
        } catch (err) {
          console.log(err)
          return h.redirect(`${invalidSubmissionPath}/`)
        }
        
        return h.redirect(nextPath)
      }
    
  }
]

