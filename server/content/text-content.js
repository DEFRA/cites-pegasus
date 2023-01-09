const Joi = require("@hapi/joi")
const textContent = require("./text-content.json")

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
  defaultTitle: Joi.string(),
  pageHeader: Joi.string(),
  selectLabelAddress: Joi.string(),
  selectAddressPromptNoResults: Joi.string(),
  selectAddressPromptSingle: Joi.string(),
  selectAddressPromptMultiple: Joi.string(),
  changePostcodeLinkText: Joi.string(),
  enterManualAddressLinkText: Joi.string()
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
  errorMessagesImport: Joi.object(),
  errorMessagesExport: Joi.object(),
  errorMessagesReexport: Joi.object(),
  errorMessagesArticle10: Joi.object(),
})

const contactDetailsSchema = Joi.object({
  defaultTitleImport: Joi.string().required(),
  defaultTitleExport: Joi.string().required(),
  defaultTitleReexport: Joi.string().required(),
  defaultTitleArticle10: Joi.string().required(),
  pageHeaderImport: Joi.string().required(),
  pageHeaderExport: Joi.string().required(),
  pageHeaderReexport: Joi.string().required(),
  pageHeaderArticle10: Joi.string().required(),
  inputLabelFullName: Joi.string().required(),
  inputLabelBusinessName: Joi.string().required(),
  inputHintBusinessNameImport: Joi.string().required(),
  inputHintBusinessNameExport: Joi.string().required(),
  inputHintBusinessNameReexport: Joi.string().required(),
  inputHintBusinessNameArticle10: Joi.string().required(),
  inputLabelEmail: Joi.string().required(),
  inputHintEmailImport: Joi.string().required(),
  inputHintEmailExport: Joi.string().required(),
  inputHintEmailReexport: Joi.string().required(),
  inputHintEmailArticle10: Joi.string().required(),
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
  pageBodyImport: Joi.string().required(),
  pageBodyExport: Joi.string().required(),
  pageBodyReexport: Joi.string().required(),
  pageBodyArticle10: Joi.string().required(),
  inputLabelAddressLine1: Joi.string(),
  inputLabelAddressLine2: Joi.string(),
  inputLabelAddressLine3: Joi.string(),
  inputLabelAddressLine4: Joi.string(),
  inputLabelPostcode: Joi.string(),
  inputLabelCountry: Joi.string(),
  errorMessages: Joi.object()
})

const confirmAddressSchema = Joi.object({
  defaultTitleImport: Joi.string().required(),
  defaultTitleExport: Joi.string().required(),
  defaultTitleReexport: Joi.string().required(),
  defaultTitleArticle10: Joi.string().required(),
  pageHeaderImport: Joi.string().required(),
  pageHeaderExport: Joi.string().required(),
  pageHeaderReexport: Joi.string().required(),
  pageHeaderArticle10: Joi.string().required(),
  changeAddressLinkText: Joi.string()
})

const sourceCodeSchema = Joi.object({
  defaultTitle: Joi.string().required(),
  heading: Joi.string().required(),
  radioOptionW: Joi.string().required(),
  radioOptionWHint: Joi.string().required(),
  radioOptionR: Joi.string().allow("", null),
  radioOptionRHint: Joi.string().allow("", null),
  radioOptionD: Joi.string().required(),
  radioOptionDHint: Joi.string().required(),
  radioOptionC: Joi.string().allow("", null),
  radioOptionCHint: Joi.string().allow("", null),
  radioOptionF: Joi.string().allow("", null),
  radioOptionFHint: Joi.string().allow("", null),
  radioOptionI: Joi.string().required(),
  radioOptionIHint: Joi.string().required(),
  inputLabelEnterAnotherSourceCode: Joi.string().required(),
  radioOptionO: Joi.string().required(),
  radioOptionOHint: Joi.string().required(),
  radioOptionX: Joi.string().required(),
  radioOptionXHint: Joi.string().required(),
  radioOptionA: Joi.string().allow("", null),
  radioOptionAHint: Joi.string().allow("", null),
  radioOptionU: Joi.string().required(),
  radioOptionUHint: Joi.string().required(),
  characterCountLabelEnterAReason: Joi.string().required(),
  dividerText: Joi.string().required()
})

const schema = Joi.object().keys({
  common: Joi.object({
    serviceName: Joi.string().required(),
    phaseBannerPhase: Joi.string().required(),
    phaseBannerHTML: Joi.string().required(),
    backLinkButton: Joi.string().required(),
    continueButton: Joi.string().required(),
    confirmButton: Joi.string().required(),
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
  applyingOnBehalf: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody1: Joi.string().required(),
    bulletListItems: Joi.array().items(Joi.object().keys({bulletListItem: Joi.string().required()})),
    pageBody2: Joi.string().required()
  }),
  contactDetails: Joi.object({
    agent: contactDetailsSchema,
    applicant: contactDetailsSchema,
    agentLed: contactDetailsSchema
  }),
  postcode: Joi.object({
    common: Joi.object({
      buttonFindAddress: Joi.string().required(),
      linkTextEnterAddress: Joi.string().required(),
      inputLabelPostcode: Joi.string().required(),
    }),
    agent: postcodeSchema,
    applicant: postcodeSchema,
    agentLed: postcodeSchema,
    delivery: postcodeSchema
  }),
  searchAddress: Joi.object({
    agent: searchAddressSchema,
    applicant: searchAddressSchema,
    agentLed: searchAddressSchema
  }),
  selectAddress: Joi.object({
    common: Joi.object({
      defaultTitle: Joi.string().required(),
      pageHeader: Joi.string().required(),
      selectLabelAddress: Joi.string().required(),
      selectAddressPromptNoResults: Joi.string().required(),
      selectAddressPromptSingle: Joi.string().required(),
      selectAddressPromptMultiple: Joi.string().required(),
      changePostcodeLinkText: Joi.string().required()
    }),
    agent: selectAddressSchema,
    applicant: selectAddressSchema,
    agentLed: selectAddressSchema,
    delivery: selectAddressSchema
  }),
  enterAddress: Joi.object({
    common: Joi.object({
      inputLabelAddressLine1: Joi.string().required(),
      inputLabelAddressLine2: Joi.string().required(),
      inputLabelAddressLine3: Joi.string().required(),
      inputLabelAddressLine4: Joi.string().required(),
      inputLabelPostcode: Joi.string().required(),
      inputLabelCountry: Joi.string().required(),
    }),
    agent: enterAddressSchema,
    applicant: enterAddressSchema,
    agentLed: enterAddressSchema,
    delivery: enterAddressSchema
  }),
  confirmAddress: Joi.object({
    common: Joi.object({
      changeAddressLinkText: Joi.string().required()
    }),
    agent: confirmAddressSchema,
    applicant: confirmAddressSchema,
    agentLed: confirmAddressSchema,
    delivery: confirmAddressSchema
  }),
  selectDeliveryAddress: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    radioOptionDeliverToApplicantAddress: Joi.string().required(),
    radioOptionDeliverToAgentAddress: Joi.string().required(),
    radioOptionDeliverToDifferentAddress: Joi.string().required(),
    errorMessages: Joi.object()
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
  couldNotConfirm: Joi.object({
    pageTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    bodyText1: Joi.string().required(),
    bodyText2: Joi.string().required(),
    linkText: Joi.string().required(),
    linkUrl: Joi.string().required(),
    searchAgainButton: Joi.string().required()
  }),
  sourceCode: Joi.object({
    animal: sourceCodeSchema,
    plant: sourceCodeSchema
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
  useCertificateFor: Joi.object({
    defaultTitle: Joi.string().required(),
    heading: Joi.string().required(),
    radioOptionLegally: Joi.string().required(),
    radioOptionCommercialActivities: Joi.string().required(),
    radioOptionOther: Joi.string().required(),
    radioOptionMoveALiveSpecimen: Joi.string().required(),
  }),
})

// Validate config
const { error, value } = schema.validate(textContent)

// Throw if config is invalid
if (error) {
  throw new Error(`The text-content.json file is invalid. ${error.message}`)
}

module.exports = value
