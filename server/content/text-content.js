const Joi = require('@hapi/joi');
const textContent = require('./text-content.json');

const searchAddressSchema = Joi.object({
  defaultTitle: Joi.string().required(),
  pageHeader: Joi.string().required(),
  pageBody: Joi.string().required(),
  inputLabelProperty: Joi.string().required(),
  inputLabelStreet: Joi.string().required(),
  inputLabelTown: Joi.string().required()
})

const selectAddressSchema = Joi.object({
  defaultTitle: Joi.string().required(),
  pageHeader: Joi.string().required(),
  selectLabelAddress: Joi.string().required(),
  selectAddressPromptNoResults: Joi.string().required(),
  selectAddressPromptSingle: Joi.string().required(),
  selectAddressPromptMultiple: Joi.string().required(),
  detailsSummaryText: Joi.string().required(),
  detailsText: Joi.string().required(),
  detailsLinkText: Joi.string().required(),
  linkTextSearchAgain: Joi.string().required(),
  bodyTextImport: Joi.string().allow("", null),
  bodyTextExport: Joi.string().allow("", null),
  bodyTextReexport: Joi.string().allow("", null),
  bodyTextArticle10: Joi.string().allow("", null)
})

const postcodeSchema = Joi.object({
  defaultTitle: Joi.string().required(),
  pageHeader: Joi.string().required(),
  inputLabelPostcode: Joi.string().required(),
  buttonFindAddress: Joi.string().required(),
  linkTextUnknownPostcode: Joi.string().required(),
  linkTextInternationalAddress: Joi.string().required()
})

const contactDetailsSchema = Joi.object({
  defaultTitle: Joi.string().required(),
  pageHeader: Joi.string().required(),
  inputLabelFullName: Joi.string().required(),
  inputLabelBusinessName: Joi.string().required(),
  inputHintBusinessName: Joi.string().required(),
  inputLabelEmail: Joi.string().required(),
  inputHintEmail: Joi.string().required(),
})

const schema = Joi.object().keys({
  common: Joi.object({
    serviceName: Joi.string().required(),
    backLinkButton: Joi.string().required(),
    continueButton: Joi.string().required(),
    searchButton: Joi.string().required(),
    startButton: Joi.string().required(),
    finishButton: Joi.string().required(),
    errorSummaryTitlePrefix: Joi.string().required(),
    errorSummaryTitle: Joi.string().required(),
    radioOptionYes: Joi.string().required(),
    radioOptionNo: Joi.string().required()
  }),
  applyCitesPermit: Joi.object({
    pageTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody1: Joi.string().required(),
    pageBody2: Joi.string().required(),
    bullet1: Joi.string().required(),
    bullet2: Joi.string().required()
  }),
  permitType: Joi.object({
    defaultTitle: Joi.string().required(),
    heading: Joi.string().required(),
    radioOptionImport: Joi.string().required(),
    radioOptionImportHint: Joi.string().required(),
    radioOptionExport: Joi.string().required(),
    radioOptionExportHint: Joi.string().required(),
    radioOptionReexport: Joi.string().required(),
    radioOptionReexportHint: Joi.string().required(),
    radioOptionArticle10: Joi.string().required(),
    radioOptionArticle10Hint: Joi.string().required(),
    radioOptionOther: Joi.string().required()
  }),
  cannotUseService: Joi.object({
    pageTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody: Joi.string().required(),
    bullet1: Joi.string().required(),
    bullet2: Joi.string().required(),
    linkText: Joi.string().required(),
    linkUrl: Joi.string().uri({ allowRelative: true }).required(),
    finishButtonUrl: Joi.string().uri({ allowRelative: true }).required()
  }),
  agent: Joi.object({
    defaultTitle: Joi.string().required(),
    radioHeaderAgent: Joi.string().required(),
    radioHeaderAgentHint: Joi.string().required()
  }),
  contactDetails: Joi.object({
    agent: contactDetailsSchema,
    applicant: contactDetailsSchema,
    agentLed: contactDetailsSchema
  }),
  postcode: Joi.object({
    agent: postcodeSchema,
    applicant: postcodeSchema,
    agentLed: postcodeSchema
  }),
  searchAddress: Joi.object({
    agent: searchAddressSchema,
    applicant: searchAddressSchema,
    agentLed: searchAddressSchema
  }),
  selectAddress: Joi.object({
    agent: selectAddressSchema,
    applicant: selectAddressSchema,
    agentLed: selectAddressSchema
  }),
  speciesName: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    bodyText: Joi.string().required(),
    bodyLinkText: Joi.string().required(),
    bodyLinkUrl: Joi.string().required(),
    inputLabelSpeciesName: Joi.string().required(),
    inputLabelQuantity: Joi.string().required(),
    selectLabelUnitOfMeasurement: Joi.string().required(),
    unitOfMeasurementPrompt: Joi.string().required(),
    unitsOfMeasurement: Joi.array().items(Joi.object({ text: Joi.string().required(), value: Joi.string().required() }))
  })
})


// Validate config
const { error, value } = schema.validate(textContent)

// Throw if config is invalid
if (error) {
  throw new Error(`The text-content.json file is invalid. ${error.message}`)
}

module.exports = value
