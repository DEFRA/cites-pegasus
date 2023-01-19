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
  errorMessagesArticle10: Joi.object()
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
  errorMessagesArticle10: Joi.object()
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
  inputHintEmailArticle10: Joi.string().required()
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
  pageHeader: Joi.string().required(),
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
  dividerText: Joi.string().required(),
  errorMessages: Joi.object({
    "error.sourceCode.any.required": Joi.string().required(),
    "error.anotherSourceCodeForI.string.empty": Joi.string().required(),
    "error.anotherSourceCodeForI.string.length": Joi.string().required(),
    "error.anotherSourceCodeForI.string.pattern.base": Joi.string().required(),
    "error.anotherSourceCodeForO.string.empty": Joi.string().required(),
    "error.anotherSourceCodeForO.string.length": Joi.string().required(),
    "error.anotherSourceCodeForO.string.pattern.base": Joi.string().required(),
    "error.enterAReason.string.empty": Joi.string().required(),
    "error.enterAReason.string.pattern.base": Joi.string().required(),
    "error.enterAReason.string.max": Joi.string().required()
  })
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
  }).required(),
  applyCitesPermit: Joi.object({
    pageTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody1: Joi.string().required(),
    pageBody2: Joi.string().required(),
    bullet1: Joi.string().required(),
    bullet2: Joi.string().required()
  }).required(),
  permitType: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    radioOptionImport: Joi.string().required(),
    radioOptionImportHint: Joi.string().required(),
    radioOptionExport: Joi.string().required(),
    radioOptionExportHint: Joi.string().required(),
    radioOptionReexport: Joi.string().required(),
    radioOptionReexportHint: Joi.string().required(),
    radioOptionArticle10: Joi.string().required(),
    radioOptionArticle10Hint: Joi.string().required(),
    radioOptionOther: Joi.string().required(),
    errorMessages: Joi.object({
      "error.permitType.any.required": Joi.string().required(),
      "error.permitType.any.only": Joi.string().required()
    })
  }).required(),
  cannotUseService: Joi.object({
    pageTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody: Joi.string().required(),
    bullet1: Joi.string().required(),
    bullet2: Joi.string().required(),
    linkText: Joi.string().required(),
    linkUrl: Joi.string().uri({ allowRelative: true }).required(),
    finishButtonUrl: Joi.string().uri({ allowRelative: true }).required()
  }).required(),
  applyingOnBehalf: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody1: Joi.string().required(),
    bulletListItems: Joi.array().items(
      Joi.object().keys({ bulletListItem: Joi.string().required() })
    ),
    pageBody2: Joi.string().required(),
    errorMessages: Joi.object({
      "error.isAgent.any.required": Joi.string().required(),
      "error.isAgent.any.only": Joi.string().required()
    }).required()
  }).required(),
  contactDetails: Joi.object({
    agent: contactDetailsSchema,
    applicant: contactDetailsSchema,
    agentLed: contactDetailsSchema,
    errorMessages: Joi.object({
      "error.fullName.string.empty": Joi.string().required(),
      "error.fullName.string.pattern.base": Joi.string().required(),
      "error.businessName.string.pattern.base": Joi.string().required(),
      "error.email.string.email": Joi.string().required()
    }).required()
  }).required(),
  postcode: Joi.object({
    common: Joi.object({
      buttonFindAddress: Joi.string().required(),
      linkTextEnterAddress: Joi.string().required(),
      inputLabelPostcode: Joi.string().required(),
      errorMessages: Joi.object({
        "error.postcode.string.empty": Joi.string().required()
      }).required()
    }).required(),
    agent: postcodeSchema,
    applicant: postcodeSchema,
    agentLed: postcodeSchema,
    delivery: postcodeSchema
  }).required(),
  searchAddress: Joi.object({
    agent: searchAddressSchema,
    applicant: searchAddressSchema,
    agentLed: searchAddressSchema
  }).required(),
  selectAddress: Joi.object({
    common: Joi.object({
      defaultTitle: Joi.string().required(),
      pageHeader: Joi.string().required(),
      selectLabelAddress: Joi.string().required(),
      selectAddressPromptNoResults: Joi.string().required(),
      selectAddressPromptSingle: Joi.string().required(),
      selectAddressPromptMultiple: Joi.string().required(),
      changePostcodeLinkText: Joi.string().required(),
      errorMessages: Joi.object({
        "error.address.string.empty": Joi.string().required()
      }).required()
    }).required(),
    agent: selectAddressSchema,
    applicant: selectAddressSchema,
    agentLed: selectAddressSchema,
    delivery: selectAddressSchema
  }).required(),
  enterAddress: Joi.object({
    common: Joi.object({
      inputLabelAddressLine1: Joi.string().required(),
      inputLabelAddressLine2: Joi.string().required(),
      inputLabelAddressLine3: Joi.string().required(),
      inputLabelAddressLine4: Joi.string().required(),
      inputLabelPostcode: Joi.string().required(),
      inputLabelCountry: Joi.string().required(),
      errorMessages: Joi.object({
        "error.addressLine1.string.empty": Joi.string().required(),
        "error.addressLine1.string.max": Joi.string().required(),
        "error.addressLine2.string.empty": Joi.string().required(),
        "error.addressLine2.string.max": Joi.string().required(),
        "error.addressLine3.string.empty": Joi.string().required(),
        "error.addressLine3.string.max": Joi.string().required(),
        "error.addressLine4.string.empty": Joi.string().required(),
        "error.addressLine4.string.max": Joi.string().required(),
        "error.postcode.string.empty": Joi.string().required(),
        "error.postcode.string.max": Joi.string().required(),
        "error.postcode.string.pattern.base": Joi.string().required(),
        "error.country.string.empty": Joi.string().required(),
        "error.country.string.max": Joi.string().required()
      }).required()
    }).required(),
    agent: enterAddressSchema,
    applicant: enterAddressSchema,
    agentLed: enterAddressSchema,
    delivery: enterAddressSchema
  }).required(),
  confirmAddress: Joi.object({
    common: Joi.object({
      changeAddressLinkText: Joi.string().required()
    }).required(),
    agent: confirmAddressSchema,
    applicant: confirmAddressSchema,
    agentLed: confirmAddressSchema,
    delivery: confirmAddressSchema
  }).required(),
  selectDeliveryAddress: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    radioOptionDeliverToApplicantAddress: Joi.string().required(),
    radioOptionDeliverToAgentAddress: Joi.string().required(),
    radioOptionDeliverToDifferentAddress: Joi.string().required(),
    errorMessages: Joi.object({
      "error.deliveryAddressOption.any.required": Joi.string().required(),
      "error.deliveryAddressOption.any.only": Joi.string().required()
    }).required()
  }).required(),
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
    unitsOfMeasurement: Joi.array().items(Joi.object()),
    errorMessages: Joi.object({
      "error.speciesName.string.empty": Joi.string().required(),
      "error.unitOfMeasurement.string.empty": Joi.string().required(),
      "error.quantity.number.base": Joi.string().required(),
      "error.quantity.number.min": Joi.string().required(),
      "error.quantity.number.max": Joi.string().required()
    }).required()
  }).required(),
  couldNotConfirm: Joi.object({
    pageTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    bodyText1: Joi.string().required(),
    bodyText2: Joi.string().required(),
    linkText: Joi.string().required(),
    linkUrl: Joi.string().required(),
    searchAgainButton: Joi.string().required()
  }).required(),
  sourceCode: Joi.object({
    animal: sourceCodeSchema,
    plant: sourceCodeSchema
  }).required(),
  purposeCode: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
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
    errorMessages: Joi.object({
      "error.purposeCode.any.required": Joi.string().required()
    }).required()
  }).required(),
  useCertificateFor: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    radioOptionLegallyAcquired: Joi.string().required(),
    radioOptionCommercialActivities: Joi.string().required(),
    radioOptionOther: Joi.string().required(),
    radioOptionMoveALiveSpecimen: Joi.string().required(),
    errorMessages: Joi.object({
      "error.useCertificateFor.any.required": Joi.string().required()
    }).required()
  }).required(),
  specimenType: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    radioOptionAnimalLiving: Joi.string().required(),
    radioOptionAnimalPart: Joi.string().required(),
    radioOptionAnimalWorked: Joi.string().required(),
    radioOptionAnimalCoral: Joi.string().required(),
    radioOptionPlantLiving: Joi.string().required(),
    radioOptionPlantProduct: Joi.string().required(),
    radioOptionPlantProductHint: Joi.string().required(),
    radioOptionPlantWorked: Joi.string().required(),
    radioOptionPlantWorkedHint: Joi.string().required(),
    errorMessages: Joi.object({
      "error.specimenType.any.only": Joi.string().required(),
      "error.specimenType.any.required": Joi.string().required()
    }).required()
  }).required(),
  tradeTermCode: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputLabelTradeCode: Joi.string().required(),
    inputLabelTradeCodeHint: Joi.string().required(),
    errorMessages: Joi.object({
      "error.isTradeTermCode.any.required": Joi.string().required(),
      "error.tradeTermCode.string.empty": Joi.string().required(),
      "error.tradeTermCode.string.length": Joi.string().required(),
      "error.tradeTermCode.string.pattern.base": Joi.string().required()
    }).required()
  }).required(),
  createdDate: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageHeaderHint: Joi.string().required(),
    checkboxLabelIsExactDateUnknown: Joi.string().required(),
    inputLabelEnterAnApproximateDate: Joi.string().required(),
    inputLabelHintEnterAnApproximateDate: Joi.string().required(),
    errorMessages: Joi.object({
      "error.createdDate.string.empty": Joi.string().required(),
      "error.createdDate.string.max": Joi.string().required(),
      "error.createdDate.string.pattern.base": Joi.string().required(),
      "error.createdDate.string.format": Joi.string().required(),
      "error.enterAnApproximateDate.string.empty": Joi.string().required()
    }).required()
  }).required(),
  uniqueIdentificationMark: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputLabelUniqueIdentificationMark: Joi.string().required(),
    radioOptionMicrochipNumber: Joi.string().required(),
    radioOptionClosedRingNumber: Joi.string().required(),
    radioOptionSplitRingNumber: Joi.string().required(),
    radioOptionOtherRingNumber: Joi.string().required(),
    radioOptionCableTie: Joi.string().required(),
    radioOptionHuntingTrophy: Joi.string().required(),
    radioOptionLabel: Joi.string().required(),
    radioOptionSwissInstitue: Joi.string().required(),
    radioOptionSerialNumber: Joi.string().required(),
    radioOptionDivider: Joi.string().required(),
    radioOptionUnmarked: Joi.string().required(),
    errorMessages: Joi.object({
      "error.uniqueIdentificationMarkType.any.required": Joi.string().required(),
      "error.uniqueIdentificationMarkType.any.only": Joi.string().required(),
      "error.inputCR.string.empty": Joi.string().required(),
      "error.inputCR.string.max": Joi.string().required(),
      "error.inputCR.string.min": Joi.string().required(),
      "error.inputCT.string.empty": Joi.string().required(),
      "error.inputCT.string.max": Joi.string().required(),
      "error.inputCT.string.min": Joi.string().required(),
      "error.inputHU.string.empty": Joi.string().required(),
      "error.inputHU.string.max": Joi.string().required(),
      "error.inputHU.string.min": Joi.string().required(),
      "error.inputLB.string.empty": Joi.string().required(),
      "error.inputLB.string.max": Joi.string().required(),
      "error.inputLB.string.min": Joi.string().required(),
      "error.inputMC.string.empty": Joi.string().required(),
      "error.inputMC.string.max": Joi.string().required(),
      "error.inputMC.string.min": Joi.string().required(),
      "error.inputOT.string.empty": Joi.string().required(),
      "error.inputOT.string.max": Joi.string().required(),
      "error.inputOT.string.min": Joi.string().required(),
      "error.inputSN.string.empty": Joi.string().required(),
      "error.inputSN.string.max": Joi.string().required(),
      "error.inputSN.string.min": Joi.string().required(),
      "error.inputSR.string.empty": Joi.string().required(),
      "error.inputSR.string.max": Joi.string().required(),
      "error.inputSR.string.min": Joi.string().required(),
      "error.inputSI.string.empty": Joi.string().required(),
      "error.inputSI.string.max": Joi.string().required(),
      "error.inputSI.string.min": Joi.string().required()
    }).required()
  }).required(),
  describeSpecimen: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    errorMessages: Joi.object({
      "error.describeSpecimen.string.empty": Joi.string().required(),
      "error.describeSpecimen.string.pattern.base": Joi.string().required(),
      "error.describeSpecimen.string.min": Joi.string().required(),
      "error.describeSpecimen.string.max": Joi.string().required()
    }).required()
  }).required(),
  describeLivingAnimal: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputLabelSex: Joi.string().required(),
    inputLabelDateOfBirth: Joi.string().required(),
    inputLabelUndeterminedSexReason: Joi.string().required(),
    inputLabelDescription: Joi.string().required(),
    inputHintDescription: Joi.string().required(),
    inputLabelParentDetails: Joi.string().required(),
    radioOptionSexMale: Joi.string().required(),
    radioOptionSexFemale: Joi.string().required(),
    radioOptionSexUndetermined: Joi.string().required(),
    errorMessages: Joi.object().keys({
      'error.sex.any.required': Joi.string().required(),
      'error.sex.any.only': Joi.string().required()
    }).required()
  })
})

// Validate config
const { error, value } = schema.validate(textContent)

// Throw if config is invalid
if (error) {
  throw new Error(`The text-content.json file is invalid. ${error.message}`)
}

module.exports = value
