const Joi = require('@hapi/joi');
const textContent = require('./text-content.json');

const searchAddressSchema = Joi.object({
  defaultTitleImport: Joi.string().required(),
  defaultTitleExport: Joi.string().required(),
  defaultTitleReexport: Joi.string().required(),
  defaultTitleArticle10: Joi.string().required(),
  pageHeaderImport: Joi.string().required(),
  pageHeaderExport: Joi.string().required(),
  pageHeaderReexport: Joi.string().required(),
  pageHeaderArticle10: Joi.string().required(),
  pageBody: Joi.string().required(),
  inputLabelProperty: Joi.string().required(),
  inputLabelStreet: Joi.string().required(),
  inputLabelTown: Joi.string().required(),
  errorMessagesImport: Joi.object(),
  errorMessagesExport: Joi.object(),
  errorMessagesReexport: Joi.object(),
  errorMessagesArticle10: Joi.object(),
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
  bodyTextImport: Joi.string().optional().allow("", null),
  bodyTextExport: Joi.string().optional().allow("", null),
  bodyTextReexport: Joi.string().optional().allow("", null),
  bodyTextArticle10: Joi.string().optional().allow("", null)
})

const postcodeSchema = Joi.object({
  defaultTitleImport: Joi.string().required(),
  defaultTitleExport: Joi.string().required(),
  defaultTitleReexport: Joi.string().required(),
  defaultTitleArticle10: Joi.string().required(),
  pageHeaderImport: Joi.string().required(),
  pageHeaderExport: Joi.string().required(),
  pageHeaderReexport: Joi.string().required(),
  pageHeaderArticle10: Joi.string().required(),
  inputLabelPostcode: Joi.string().required(),
  buttonFindAddress: Joi.string().required(),
  linkTextUnknownPostcode: Joi.string().required(),
  linkTextInternationalAddressImport: Joi.string().optional().allow("", null),
  linkTextInternationalAddressExport: Joi.string().optional().allow("", null),
  linkTextInternationalAddressReexport: Joi.string().optional().allow("", null),
  linkTextInternationalAddressArticle10: Joi.string().optional().allow("", null),
  errorMessagesImport: Joi.object(),
  errorMessagesExport: Joi.object(),
  errorMessagesReexport: Joi.object(),
  errorMessagesArticle10: Joi.object(),
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

const enterAddressSchema = Joi.object({
  defaultTitleImport: Joi.string().required(),
  defaultTitleExport: Joi.string().required(),
  defaultTitleReexport: Joi.string().required(),
  defaultTitleArticle10: Joi.string().required(),
  pageHeaderImport: Joi.string().required(),
  pageHeaderExport: Joi.string().required(),
  pageHeaderReexport: Joi.string().required(),
  pageHeaderArticle10: Joi.string().required(),
  pageBody: Joi.string().required(),
  inputLabelAddressLine1: Joi.string().required(),
  inputLabelAddressLine2: Joi.string().required(),
  inputLabelTown: Joi.string().required(),
  inputLabelCounty: Joi.string().required(),
  inputLabelPostcode: Joi.string().required(),
  errorMessagesImport: Joi.object(),
  errorMessagesExport: Joi.object(),
  errorMessagesReexport: Joi.object(),
  errorMessagesArticle10: Joi.object(),
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
    radioOptionNo: Joi.string().required(),
    errorMessages: Joi.object()
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
  enterAddress: Joi.object({
    agent: enterAddressSchema,
    applicant: enterAddressSchema,
    agentLed: enterAddressSchema
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
    unitsOfMeasurement: Joi.array().items(Joi.object())
  }),
  purposeCode: Joi.object({
    defaultTitle: Joi.string().required(),
    heading: Joi.string().required(),
    radioOptionB: Joi.string().required(),
    radioOptionBHint: Joi.string().required(),
    radioOptionE: Joi.string().required(),
    radioOptionEHint: Joi.string().required(),
    radioOptionG: Joi.string().required(),
    radioOptionGHint: Joi.string().required(),
    radioOptionH: Joi.string().required(),
    radioOptionHHint: Joi.string().required(),
    radioOptionL: Joi.string().required(),
    radioOptionLHint: Joi.string().required(),
    radioOptionM: Joi.string().required(),
    radioOptionMHint: Joi.string().required(),
    radioOptionN: Joi.string().required(),
    radioOptionNHint: Joi.string().required(),
    radioOptionP: Joi.string().required(),
    radioOptionPHint: Joi.string().required(),
    radioOptionQ: Joi.string().required(),
    radioOptionQHint: Joi.string().required(),
    radioOptionS: Joi.string().required(),
    radioOptionSHint: Joi.string().required(),
    radioOptionT: Joi.string().required(),
    radioOptionTHint: Joi.string().required(),
    radioOptionZ: Joi.string().required(),
    radioOptionZHint: Joi.string().required(),
  }),
})


// Validate config
const { error, value } = schema.validate(textContent)

// Throw if config is invalid
if (error) {
  throw new Error(`The text-content.json file is invalid. ${error.message}`)
}

module.exports = value
