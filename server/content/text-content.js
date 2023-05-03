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
  errorMessages: Joi.object({
    "error.addressLine1.string.empty": Joi.string(),
    "error.addressLine1.string.max": Joi.string(),
    "error.addressLine1.string.pattern.base": Joi.string(),
    "error.addressLine2.string.empty": Joi.string(),
    "error.addressLine2.string.max": Joi.string(),
    "error.addressLine2.string.pattern.base": Joi.string(),
    "error.addressLine3.string.empty": Joi.string(),
    "error.addressLine3.string.max": Joi.string(),
    "error.addressLine3.string.pattern.base": Joi.string(),
    "error.addressLine4.string.max": Joi.string(),
    "error.addressLine4.string.pattern.base": Joi.string(),
    "error.postcode.string.empty": Joi.string(),
    "error.postcode.string.max": Joi.string(),
    "error.postcode.string.pattern.base": Joi.string(),
    "error.country.string.empty": Joi.string(),
    "error.country.string.max": Joi.string()
  })
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

const importerExporterDetailsSchema = Joi.object({
  defaultTitle: Joi.string().required(),
  pageHeader: Joi.string().required(),
  heading: Joi.string().required(),
  errorMessages: Joi.object({
    "error.name.string.empty": Joi.string().required(),
    "error.name.string.max": Joi.string().optional(),
    "error.name.string.pattern.base": Joi.string().optional(),
    "error.addressLine1.string.empty": Joi.string().optional(),
    "error.addressLine1.string.max": Joi.string().optional(),
    "error.addressLine2.string.empty": Joi.string().optional(),
    "error.addressLine2.string.max": Joi.string().optional(),
    "error.addressLine3.string.max": Joi.string().optional(),
    "error.addressLine4.string.max": Joi.string().optional(),
    "error.postcode.string.max": Joi.string().optional(),
    "error.country.string.empty": Joi.string().optional(),
    "error.country.string.max": Joi.string().optional()
  }).required()
}).required()

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
  radioOptionY: Joi.string().allow("", null),
  radioOptionYHint: Joi.string().allow("", null),
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

const areYouSureSchema = Joi.object({
  defaultTitle: Joi.string().required(),
  pageHeader: Joi.string().required(),
  pageBody1: Joi.string().required(),
  pageBody2: Joi.string().allow("", null),
  errorMessages: Joi.object({
    "error.areYouSure.any.required": Joi.string().required(),
  }).required()
}).required()

const yourSubmissionSchema = Joi.object({
  defaultTitle: Joi.string().required(),
  pageHeader: Joi.string().required(),
}).required()

const schema = Joi.object().keys({
  common: Joi.object({
    serviceName: Joi.string().required(),
    phaseBannerPhase: Joi.string().required(),
    phaseBannerHTML: Joi.string().required(),
    navigationSignOut: Joi.string().required(),
    backLinkButton: Joi.string().required(),
    continueButton: Joi.string().required(),
    confirmButton: Joi.string().required(),
    submitButton: Joi.string().required(),
    searchButton: Joi.string().required(),
    startButton: Joi.string().required(),
    finishButton: Joi.string().required(),
    copyButton: Joi.string().required(),
    removeButton: Joi.string().required(),
    agreeAndSubmitButton: Joi.string().required(),
    errorSummaryTitlePrefix: Joi.string().required(),
    errorSummaryTitle: Joi.string().required(),
    radioOptionYes: Joi.string().required(),
    radioOptionNo: Joi.string().required(),
    countrySelectDefault: Joi.string().required(),
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
    link: Joi.string().required(),
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
      "error.fullName.string.max": Joi.string().required(),
      "error.fullName.string.pattern.base": Joi.string().required(),
      "error.businessName.string.pattern.base": Joi.string().required(),
      "error.businessName.string.max": Joi.string().required(),
      "error.email.string.email": Joi.string().required(),
      "error.email.string.max": Joi.string().required()
    }).required()
  }).required(),
  postcode: Joi.object({
    common: Joi.object({
      buttonFindAddress: Joi.string().required(),
      linkTextEnterAddress: Joi.string().required(),
      inputLabelPostcode: Joi.string().required(),
      errorMessages: Joi.object({
        "error.postcode.string.empty": Joi.string().required(),
        "error.postcode.string.pattern.base": Joi.string().required()
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
    bodyText2: Joi.string().required(),
    inputLabelSpeciesName: Joi.string().required(),
    errorMessages: Joi.object({
      "error.speciesName.string.empty": Joi.string().required()
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
    pageBody: Joi.string().required(),
    tradeTermCodeSelectDefault: Joi.string().required(),
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
    inputLabelApproximateDate: Joi.string().required(),
    inputLabelHintApproximateDate: Joi.string().required(),
    errorMessages: Joi.object({
      "error.createdDate.any.empty": Joi.string().required(),
      "error.createdDate.any.future": Joi.string().required(),
      "error.createdDate.any.invalid": Joi.string().required(),
      "error.createdDate-day.any.empty": Joi.string().required(),
      "error.createdDate-day-month.any.empty": Joi.string().required(),
      "error.createdDate-day-year.any.empty": Joi.string().required(),
      "error.createdDate-month.any.empty": Joi.string().required(),
      "error.createdDate-month-year.any.empty": Joi.string().required(),
      "error.createdDate-year.any.empty": Joi.string().required(),
      "error.approximateDate.string.empty": Joi.string().required()
    }).required()
  }).required(),
  acquiredDate: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageHeaderHint: Joi.string().required(),
    checkboxLabelIsExactDateUnknown: Joi.string().required(),
    inputLabelApproximateDate: Joi.string().required(),
    inputLabelHintApproximateDate: Joi.string().required(),
    errorMessages: Joi.object({
      "error.acquiredDate.any.empty": Joi.string().required(),
      "error.acquiredDate.any.future": Joi.string().required(),
      "error.acquiredDate.any.invalid": Joi.string().required(),
      "error.acquiredDate-day.any.empty": Joi.string().required(),
      "error.acquiredDate-day-month.any.empty": Joi.string().required(),
      "error.acquiredDate-day-year.any.empty": Joi.string().required(),
      "error.acquiredDate-month.any.empty": Joi.string().required(),
      "error.acquiredDate-month-year.any.empty": Joi.string().required(),
      "error.acquiredDate-year.any.empty": Joi.string().required(),
      "error.approximateDate.string.empty": Joi.string().required()
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
      "error.uniqueIdentificationMarkType.any.required":
        Joi.string().required(),
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
  specimenDescriptionGeneric: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    errorMessages: Joi.object({
      "error.specimenDescriptionGeneric.string.empty": Joi.string().required(),
      "error.specimenDescriptionGeneric.string.pattern.base":
        Joi.string().required(),
      "error.specimenDescriptionGeneric.string.min": Joi.string().required(),
      "error.specimenDescriptionGeneric.string.max": Joi.string().required()
    }).required()
  }).required(),
  describeLivingAnimal: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputLabelSex: Joi.string().required(),
    inputLabelDateOfBirth: Joi.string().required(),
    inputLabelUndeterminedSexReason: Joi.string().required(),
    inputHintDateOfBirth: Joi.string().required(),
    inputLabelDescription: Joi.string().required(),
    inputHintDescription: Joi.string().required(),
    inputLabelParentDetails: Joi.string().required(),
    inputHintParentDetails: Joi.string().required(),
    radioOptionSexMale: Joi.string().required(),
    radioOptionSexFemale: Joi.string().required(),
    radioOptionSexUndetermined: Joi.string().required(),
    errorMessages: Joi.object()
      .keys({
        "error.sex.any.required": Joi.string().required(),
        "error.sex.any.only": Joi.string().required(),
        "error.parentDetails.string.empty": Joi.string().required(),
        "error.parentDetails.string.min": Joi.string().required(),
        "error.parentDetails.string.max": Joi.string().required(),
        "error.description.string.max": Joi.string().required(),
        "error.dateOfBirth.any.future": Joi.string().required(),
        "error.dateOfBirth.any.invalid": Joi.string().required(),
        "error.dateOfBirth-day.number.base": Joi.string().required(),
        "error.dateOfBirth-month.number.base": Joi.string().required(),
        "error.dateOfBirth-year.number.base": Joi.string().required()
      })
      .required()
  }).required(),
  importerExporter: Joi.object({
    common: Joi.object({
      inputLabelCountry: Joi.string().required(),
      headingAddress: Joi.string().required(),
      inputLabelFullName: Joi.string().required(),
      inputLabelAddressLine1: Joi.string().required(),
      inputLabelAddressLine2: Joi.string(),
      inputLabelAddressLine3: Joi.string(),
      inputLabelAddressLine4: Joi.string(),
      inputLabelPostcode: Joi.string().required(),
      errorMessages: Joi.object({
        "error.name.string.max": Joi.string().required(),
        "error.name.string.pattern.base": Joi.string().required(),
        "error.addressLine1.string.empty": Joi.string().required(),
        "error.addressLine1.string.max": Joi.string().required(),
        "error.addressLine2.string.empty": Joi.string().required(),
        "error.addressLine2.string.max": Joi.string().required(),
        "error.addressLine3.string.max": Joi.string().required(),
        "error.addressLine4.string.max": Joi.string().required(),
        "error.postcode.string.max": Joi.string().required(),
        "error.country.string.empty": Joi.string().required(),
        "error.country.string.max": Joi.string().required()
      }).required()
    }).required(),
    importerDetails: importerExporterDetailsSchema,
    exporterDetails: importerExporterDetailsSchema
  }).required(),
  alreadyHaveA10: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputLabelA10CertificateNumber: Joi.string().required(),
    inputLabelA10CertificateNumberHint: Joi.string().required(),
    errorMessages: Joi.object({
      "error.isA10CertificateNumberKnown.any.required": Joi.string().required(),
      "error.a10CertificateNumber.string.empty": Joi.string().required(),
      "error.a10CertificateNumber.string.min": Joi.string().required(),
      "error.a10CertificateNumber.string.max": Joi.string().required(),
      "error.a10CertificateNumber.string.pattern.base": Joi.string().required()
    }).required()
  }).required(),
  everImportedExported: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    errorMessages: Joi.object({
      "error.isEverImportedExported.any.required": Joi.string().required()
    }).required()
  }).required(),
  unmarkedSpecimens: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageHeaderHint: Joi.string().required(),
    errorMessages: Joi.object({
      "error.numberOfUnmarkedSpecimens.any.empty": Joi.string().required(),
      "error.numberOfUnmarkedSpecimens.number.base": Joi.string().required(),
      "error.numberOfUnmarkedSpecimens.number.integer": Joi.string().required(),
      "error.numberOfUnmarkedSpecimens.number.min": Joi.string().required(),
      "error.numberOfUnmarkedSpecimens.number.unsafe": Joi.string().required(),
      "error.numberOfUnmarkedSpecimens.number.max": Joi.string().required()
    }).required()
  }).required(),
  quantity: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputLabelQuantity: Joi.string().required(),
    selectLabelUnitOfMeasurement: Joi.string().required(),
    unitOfMeasurementPrompt: Joi.string().required(),
    unitsOfMeasurement: Joi.array().items(
      Joi.object({
        "text": Joi.string().required(),
        "value": Joi.string().required()
      }).required()
    ),
    errorMessages: Joi.object({
      "error.unitOfMeasurement.any.only": Joi.string().required(),
      "error.quantity.any.empty": Joi.string().required(),
      "error.quantity.number.base": Joi.string().required(),
      "error.quantity.number.min": Joi.string().required(),
      "error.quantity.number.max": Joi.string().required(),
      "error.quantity.number.unsafe": Joi.string().required()
    }).required()
  }).required(),
  permitDetails: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    headingImport: Joi.string().required(),
    headingReexportA10: Joi.string().required(),
    inputLabelCountry: Joi.string().required(),
    inputLabelPermitNumber: Joi.string().required(),
    inputLabelPermitIssueDate: Joi.string().required(),
    inputLabelHintPermitIssueDate: Joi.string().required(),
    dividerText: Joi.string().required(),
    checkboxLabelNotApplicable: Joi.string().required(),
    headingCountryOfOrigin: Joi.string().required(),
    errorMessages: Joi.object({
      "error.exportOrReexportCountry.string.empty": Joi.string().required(),
      "error.exportOrReexportCountry.any.empty": Joi.string().required(),
      "error.exportOrReexportCountry.any.required": Joi.string().required(),
      "error.exportOrReexportCountry.string.max": Joi.string().required(),
      "error.exportOrReexportPermitNumber.any.required":
        Joi.string().required(),
      "error.exportOrReexportPermitNumber.string.empty":
        Joi.string().required(),
      "error.exportOrReexportPermitNumber.string.pattern.base":
        Joi.string().required(),
      "error.exportOrReexportPermitNumber.string.min": Joi.string().required(),
      "error.exportOrReexportPermitNumber.string.max": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate.any.empty":
        Joi.string().required(),
      "error.exportOrReexportPermitIssueDate.any.future":
        Joi.string().required(),
      "error.exportOrReexportPermitIssueDate.any.invalid":
        Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-day.any.empty":
        Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-day-month.any.empty":
        Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-day-year.any.empty":
        Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-month.any.empty":
        Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-month-year.any.empty":
        Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-year.any.empty":
        Joi.string().required(),
      "error.countryOfOrigin.string.empty": Joi.string().required(),
      "error.countryOfOrigin.any.empty": Joi.string().required(),
      "error.countryOfOrigin.any.required": Joi.string().required(),
      "error.countryOfOrigin.string.max": Joi.string().required(),
      "error.countryOfOriginPermitNumber.any.required": Joi.string().required(),
      "error.countryOfOriginPermitNumber.string.empty": Joi.string().required(),
      "error.countryOfOriginPermitNumber.string.pattern.base":
        Joi.string().required(),
      "error.countryOfOriginPermitNumber.string.min": Joi.string().required(),
      "error.countryOfOriginPermitNumber.string.max": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.custom":
        Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.empty": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.future":
        Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.invalid":
        Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-day.any.empty":
        Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-day-month.any.empty":
        Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-day-year.any.empty":
        Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-month.any.empty":
        Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-month-year.any.empty":
        Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-year.any.empty":
        Joi.string().required()
    }).required()
  }).required(),
  uploadSupportingDocuments: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody1: Joi.string().required(),
    bulletList1Items: Joi.array().items(
      Joi.object().keys({ bulletListItem: Joi.string().required() })
    ),
    agentBulletListItem: Joi.string().required(),
    heading1: Joi.string().required(),
    pageBody2: Joi.string().required(),
    bulletList2Items: Joi.array().items(
      Joi.object().keys({ bulletListItem: Joi.string().required() })
    ),
    buttonUpload: Joi.string().required(),
    heading2: Joi.string().required(),
    spanNoFilesUploaded: Joi.string().required(),
    buttonDelete: Joi.string().required(),
    errorMessages: Joi.object({
      "error.fileUpload.hapi.filename.string.empty": Joi.string().required(),
      "error.fileUpload.hapi.headers.content-type.any.only": Joi.string().required(),
      "error.fileUpload.any.custom": Joi.string().required(),
      "error.fileUpload.upload.exception": Joi.string().required(),
      "error.file.delete.exception": Joi.string().required(),
      "error.fileUpload.any.filesize": Joi.string().required(),
    }).required(),
  }).required(),
  comments: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputHintAddRemarks: Joi.string().required(),
    errorMessages: Joi.object({
      "error.comments.string.max": Joi.string().required()
    }).required()
  }).required(),
  applicationSummary: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    headerPermit: Joi.string().required(),
    rowTextPermitType: Joi.string().required(),
    confirmYourApplicationButton: Joi.string().required(),
    headerYourContactDetails: Joi.string().required(),
    headerApplicantContactDetails: Joi.string().required(),
    headerExportOrReexporterContactDetails: Joi.string().required(),
    headerImporterContactDetails: Joi.string().required(),
    headerExporterContactDetails: Joi.string().required(),
    headerReexporterContactDetails: Joi.string().required(),
    headerArticle10ContactDetails: Joi.string().required(),
    rowTextFullName: Joi.string().required(),
    rowTextBusinessName: Joi.string().required(),
    rowTextEmailAddress: Joi.string().required(),
    rowTextAddress: Joi.string().required(),
    headerDeliveryAddress: Joi.string().required(),
    headerSpecimenDetails: Joi.string().required(),
    rowTextScientificName: Joi.string().required(),
    rowTextQuantity: Joi.string().required(),
    rowTextUnitOfMeasurement: Joi.string().required(),
    rowTextUnitsOfMeasurementNoOfSpecimens: Joi.string().required(),
    rowTextUnitsOfMeasurementNoOfPiecesOrParts: Joi.string().required(),
    rowTextSourceCode: Joi.string().required(),
    rowTextPurposeCode: Joi.string().required(),
    rowTextTradeTermCode: Joi.string().required(),
    rowTextUniqueIdentificationMark: Joi.string().required(),
    rowTextSpecimenIsNotMarked: Joi.string().required(),
    rowTextSex: Joi.string().required(),
    rowTextDateOfBirth: Joi.string().required(),
    rowTextParentDetails: Joi.string().required(),
    rowTextOtherDescription: Joi.string().required(),
    rowTextA10CertificatePurpose: Joi.string().required(),
    rowTextLegallyAcquired: Joi.string().required(),
    rowTextCommercialActivities: Joi.string().required(),
    rowTextOther: Joi.string().required(),
    rowTextMoveALiveSpecimen: Joi.string().required(),
    rowTextAcquiredDate: Joi.string().required(),
    rowTextExistingArticle10Certificate: Joi.string().required(),
    rowTextUnmarkedSpecimens: Joi.string().required(),
    rowTextCreatedDate: Joi.string().required(),
    rowTextDescription: Joi.string().required(),
    headerExportOrReexportPermitDetails: Joi.string().required(),
    headerPermitDetailsFromExportIntoGreatBritain: Joi.string().required(),
    rowTextCountry: Joi.string().required(),
    rowTextPermitNumber: Joi.string().required(),
    rowTextPermitIssueDate: Joi.string().required(),
    headerCountryOfOriginPermitDetails: Joi.string().required(),
    rowTextNotApplicable: Joi.string().required(),
    headerRemarks: Joi.string().required(),
    rowTextSourceCodeW: Joi.string().required(),
    rowTextSourceCodeR: Joi.string().required(),
    rowTextSourceCodeDAnimal: Joi.string().required(),
    rowTextSourceCodeDPlant: Joi.string().required(),
    rowTextSourceCodeC: Joi.string().required(),
    rowTextSourceCodeF: Joi.string().required(),
    rowTextSourceCodeA: Joi.string().required(),
    rowTextSourceCodeI: Joi.string().required(),
    rowTextSourceCodeO: Joi.string().required(),
    rowTextSourceCodeX: Joi.string().required(),
    rowTextSourceCodeY: Joi.string().required(),
    rowTextPurposeCodeB: Joi.string().required(),
    rowTextPurposeCodeE: Joi.string().required(),
    rowTextPurposeCodeG: Joi.string().required(),
    rowTextPurposeCodeH: Joi.string().required(),
    rowTextPurposeCodeL: Joi.string().required(),
    rowTextPurposeCodeM: Joi.string().required(),
    rowTextPurposeCodeN: Joi.string().required(),
    rowTextPurposeCodeP: Joi.string().required(),
    rowTextPurposeCodeQ: Joi.string().required(),
    rowTextPurposeCodeS: Joi.string().required(),
    rowTextPurposeCodeT: Joi.string().required(),
    rowTextPurposeCodeZ: Joi.string().required(),
    rowTextSpecimenType: Joi.string().required(),
    rowTextSpecimenTypeAnimalLiving: Joi.string().required(),
    rowTextSpecimenTypeAnimalPart: Joi.string().required(),
    rowTextSpecimenTypeAnimalWorked: Joi.string().required(),
    rowTextSpecimenTypeAnimalCoral: Joi.string().required(),
    rowTextSpecimenTypePlantLiving: Joi.string().required(),
    rowTextSpecimenTypePlantProduct: Joi.string().required(),
    rowTextSpecimenTypePlantWorked: Joi.string().required(),
    rowTextSexMale: Joi.string().required(),
    rowTextSexFemale: Joi.string().required(),
    rowTextNotKnown: Joi.string().required(),
    areYouSure: Joi.object({
      permitType: areYouSureSchema,
      scientificName: areYouSureSchema,
      yourContactDetails: areYouSureSchema,
      yourAddress: areYouSureSchema,
      deliveryAddress: areYouSureSchema,
      importerContactDetails: areYouSureSchema,
      exporterContactDetails: areYouSureSchema,
      reexporterContactDetails: areYouSureSchema,
      article10ContactDetails: areYouSureSchema,
      importerAddress: areYouSureSchema,
      exporterAddress: areYouSureSchema,
      reexporterAddress: areYouSureSchema,
      article10Address: areYouSureSchema
    }).required(),
  }).required(),
  yourSubmission: Joi.object({
    common: Joi.object({
      tableHeadScientificName: Joi.string(),
      tableHeadQuantity: Joi.string(),
      tableHeadUnitOfMeasurement: Joi.string(),
      rowTextUnitsOfMeasurementNoOfSpecimens: Joi.string().required(),
      rowTextUnitsOfMeasurementNoOfPiecesOrParts: Joi.string().required(),
      addAnotherSpeciesLinkText: Joi.string(),
      applyForADifferentTypeOfPermitLinkText: Joi.string()
    }).required(),
    importApplications: yourSubmissionSchema,
    exportApplications: yourSubmissionSchema,
    reexportApplications: yourSubmissionSchema,
    article10Applications: yourSubmissionSchema,
    areYouSureRemove: Joi.object({
      defaultTitlePart1: Joi.string().required(),
      defaultTitlePart2: Joi.string().required(),
      pageHeaderPart1: Joi.string().required(),
      pageHeaderPart2: Joi.string().required(),
      pageBody: Joi.string().required(),
      errorMessages: Joi.object({
        "error.areYouSure.part1.any.required": Joi.string().required(),
        "error.areYouSure.part2.any.required": Joi.string().required(),
      }).required()
    }).required(),
    areYouSurePermitType: areYouSureSchema,
  }).required(),
  declaration: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBodyAgent: Joi.string().required(),
    pageBodyApplicant: Joi.string().required(),
    bulletListItems: Joi.array().items(
      Joi.object().keys({ bulletListItem: Joi.string().required() })
    ),
    checkboxLabelIAgree: Joi.string().required(),
    errorMessages: Joi.object({
      "error.declaration.any.required": Joi.string().required(),
    }).required(),
  }).required(),
  mySubmissions: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputLabelSearch: Joi.string().required(),
    linkTextClearSearch: Joi.string().required(),
    buttonStartNewApplication: Joi.string().required(),
    heading1: Joi.string().required(),
    pageBodyPermitType: Joi.string().required(),
    checkboxLabelImport: Joi.string().required(),
    checkboxLabelExport: Joi.string().required(),
    checkboxLabelReexport: Joi.string().required(),
    checkboxLabelArticle10: Joi.string().required(),
    pageBodyStatus: Joi.string().required(),
    checkboxLabelReceived: Joi.string().required(),
    checkboxLabelAwaitingPayment: Joi.string().required(),
    checkboxLabelAwaitingReply: Joi.string().required(),
    checkboxLabelInProcess: Joi.string().required(),
    checkboxLabelIssued: Joi.string().required(),
    checkboxLabelRefused: Joi.string().required(),
    checkboxLabelCancelled: Joi.string().required(),
    checkboxLabelClosed: Joi.string().required(),
    buttonApplyFilters: Joi.string().required(),
    linkTextClearFilters: Joi.string().required(),
    rowTextReferenceNumber: Joi.string().required(),
    rowTextApplicationDate: Joi.string().required(),
    rowTextStatus: Joi.string().required(),
    rowTextReceived: Joi.string().required(),
    rowTextAwaitingPayment: Joi.string().required(),
    rowTextAwaitingReply:Joi.string().required(),
    rowTextInProcess: Joi.string().required(),
    rowTextIssued: Joi.string().required(),
    rowTextRefused: Joi.string().required(),
    rowTextCancelled: Joi.string().required(),
    pagebodyNoApplicationsFound: Joi.string().required(),
    pagebodyZeroApplication: Joi.string().required(),
  }).required(),
  payApplication: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody: Joi.string().required(),
    pageHeader2: Joi.string().required(),
    radioOptionYes: Joi.string().required(),
    radioOptionNo: Joi.string().required(),
    headingPaymentAmount: Joi.string().required(),
    paymentDescription: Joi.string().required(),
    errorMessages: Joi.object({
      'error.payNow.any.required': Joi.string().required(),
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
