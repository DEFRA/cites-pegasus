const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError, isChecked } = require('../helpers/helper-functions')
const { getAppData, setAppData, validateAppData } = require('../helpers/app-data')
const textContent = require('../content/text-content')
const pageId = 'source'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/species-name`
const nextPath = `${urlPrefix}/PURPOSE-NOT-DONE-YET`//TODO


function createModel(errorList, source) {
  const commonContent = textContent.common;
  const pageContent = null;

  if (data.partyType === 'animal') {
        pageContent = textContent.source.animal
  } else {
    pageContent = textContent.source.plant
}

  const model = {
    backLink: previousPath,
    formActionPage: currentPath,
    ...errorList ? { errorList } : {},
    pageTitle: errorList ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    inputSource: {
      idPrefix: "source",
      name: "source",
      fieldset: {
        legend: {
          text: pageContent.heading,
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l"
        }
      },
      items: [
        {
          value: "W",
          text: pageContent.radioOptionW,
          hint: { text: pageContent.radioOptionWHint },
          checked: isChecked(source, "W")
        },
        {
          value: "R",
          text: pageContent.radioOptionR,
          hint: { text: pageContent.radioOptionRHint },
          checked: isChecked(source, "R")
        },
        {
          value: "D",
          text: pageContent.radioOptionD,
          hint: { text: pageContent.radioOptionDHint },
          checked: isChecked(source, "D")
        },
        {
            value: "C",
            text: pageContent.radioOptionC,
            hint: { text: pageContent.radioOptionCHint },
            checked: isChecked(source, "C")
          },
          {
            value: "F",
            text: pageContent.radioOptionF,
            hint: { text: pageContent.radioOptionFHint },
            checked: isChecked(source, "F")
          },
          {
            value: "A",
            text: pageContent.radioOptionA,
            hint: { text: pageContent.radioOptionAHint },
            checked: isChecked(source, "A")
          },
          {
            value: "I",
            text: pageContent.radioOptionI,
            hint: { text: pageContent.radioOptionIHint },
            checked: isChecked(source, "I"),
            conditional: {
                html: emailHtml
              },
          },
          {
            value: "O",
            text: pageContent.radioOptionO,
            hint: { text: pageContent.radioOptionOHint },
            checked: isChecked(source, "O"),
            conditional: {
                html: emailHtml
              },
          },
          {
            value: "X",
            text: pageContent.radioOptionX,
            hint: { text: pageContent.radioOptionXHint },
            checked: isChecked(source, "X")
          },
          {
            divider: pageContent.dividerText,
          },
          {
            value: "U",
            text: pageContent.radioOptionDontKnow,
            hint: { text: pageContent.radioOptionDontKnowHint },
            checked: isChecked(source, "C")
          },
      ],
      errorMessage: getFieldError(errorList, '#source')
    }
  }
  return { ...commonContent, ...model }
}

module.exports = [{
  method: 'GET',
  path: currentPath,
  handler: async (request, h) => {
    const appData = getAppData(request);
    validateAppData(appData, pageId)

    return h.view(pageId, createModel(null, appData?.source));
  }
},
{
  method: 'POST',
  path: currentPath,
  options: {
    validate: {
      options: { abortEarly: false },
      payload: Joi.object({
        permitType: Joi.string().required()
      }),
      failAction: (request, h, err) => {
        const errorList = []
        const fields = ['permitType']
        fields.forEach(field => {
          const fieldError = findErrorList(err, [field])[0]
          if (fieldError) {
            errorList.push({
              text: fieldError,
              href: `#${field}`
            })
          }
        })
        
        return h.view(pageId, createModel(errorList, request.payload.permitType)).takeover()
      }
    },
    handler: async (request, h) => {
      setAppData(request, {permitType: request.payload.permitType});

      return request.payload.permitType === 'other' ? h.redirect(cannotUseServicePath) : h.redirect(nextPath);
    }
  },
}]