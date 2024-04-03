const Joi = require("@hapi/joi")
const textContent = require("./text-content.json")

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
  pageBody: Joi.string().allow("", null),
  inputLabelFullName: Joi.string().required(),
  inputLabelBusinessName: Joi.string().required(),
  inputLabelEmail: Joi.string().required(),
  inputHintEmailImport: Joi.string().required(),
  inputHintEmailExport: Joi.string().required(),
  inputHintEmailReexport: Joi.string().required(),
  inputHintEmailArticle10: Joi.string().required(),
  errorMessages: Joi.object({
    "error.fullName.string.empty": Joi.string().optional(),
    "error.fullName.string.max": Joi.string().optional(),
    "error.fullName.string.pattern.base": Joi.string().optional(),
    "error.businessName.string.pattern.base": Joi.string().optional(),
    "error.businessName.string.max": Joi.string().optional(),
    "error.email.string.email": Joi.string().optional(),
    "error.email.string.max": Joi.string().optional()
  }).optional()  
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
  pageHeaderArticle10: Joi.string().required()
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
  anotherSourceCodePrompt: Joi.string().required(),
  anotherSourceCodes: Joi.array()
    .items(
      Joi.object({
        "text": Joi.string().required(),
        "value": Joi.string().required(),
        "showForO": Joi.boolean().required(),
        "showForI": Joi.boolean().required()
      }).required()
    )
    .required(),
  errorMessages: Joi.object({
    "error.sourceCode.any.required": Joi.string().required(),
    "error.anotherSourceCodeForI.any.only": Joi.string().required(),
    "error.anotherSourceCodeForO.any.only": Joi.string().required(),
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
  copyAriaLabel: Joi.string().required(),
  removeAriaLabel: Joi.string().required()
}).required()

const schema = Joi.object().keys({
  common: Joi.object({
    serviceName: Joi.string().required(),
    phaseBannerPhase: Joi.string().required(),
    phaseBannerHTML: Joi.string().required(),
    navigationSignOut: Joi.string().required(),
    navigationAccountManagement: Joi.string().required(),
    backLinkButton: Joi.string().required(),
    continueButton: Joi.string().required(),
    saveAndContinueButton: Joi.string().required(),
    confirmButton: Joi.string().required(),
    submitButton: Joi.string().required(),
    searchButton: Joi.string().required(),
    startButton: Joi.string().required(),
    finishButton: Joi.string().required(),
    copyButton: Joi.string().required(),
    removeButton: Joi.string().required(),
    agreeAndSubmitButton: Joi.string().required(),
    confirmAndContinueButton: Joi.string().required(),
    returnYourApplicationsButton: Joi.string().required(),
    copyAsNewApplicationButton: Joi.string().required(),
    pageTitleSuffix: Joi.string().required(),
    errorSummaryTitlePrefix: Joi.string().required(),
    errorSummaryTitle: Joi.string().required(),
    radioOptionYes: Joi.string().required(),
    radioOptionNo: Joi.string().required(),
    countrySelectDefault: Joi.string().required(),
    footerLinkTextPrivacy: Joi.string().required(),
    footerLinkTextAccessibilityStatement: Joi.string().required(),
    footerLinkTextCookies: Joi.string().required(),
    footerLinkTextContactUs: Joi.string().required(),
    footerLinkUrlContactUs: Joi.string().required(),
    permitTypeDescriptionImport: Joi.string().required(),
    permitTypeDescriptionExport: Joi.string().required(),
    permitTypeDescriptionReexport: Joi.string().required(),
    permitTypeDescriptionArticle10: Joi.string().required(),
    permitTypeDescriptionMIC: Joi.string().required(),
    permitTypeDescriptionTEC: Joi.string().required(),
    permitTypeDescriptionPOC: Joi.string().required(),
    permitTypeDescriptionSemiComplete: Joi.string().required(),
    permitTypeDescriptionDraft: Joi.string().required(),
    permitTypeDescriptionArticle9Movement: Joi.string().required(),
    permitTypeDescriptionLegalAcquisition: Joi.string().required(),
    statusDescriptionReceived: Joi.string().required(),
    statusDescriptionAwaitingPayment: Joi.string().required(),
    statusDescriptionAwaitingReply: Joi.string().required(),
    statusDescriptionInProgress: Joi.string().required(),
    statusDescriptionIssued: Joi.string().required(),
    statusDescriptionRefused: Joi.string().required(),
    statusDescriptionCancelled: Joi.string().required(),
    statusDescriptionClosed: Joi.string().required(),
    helpBarQuestion: Joi.string().allow('', null),
    helpBarLinkText: Joi.string().allow('', null),
    uniqueIdentfierMarkTypes: Joi.object({
      MC: Joi.string().required(),
      CR: Joi.string().required(),
      SR: Joi.string().required(),
      OT: Joi.string().required(),
      CB: Joi.string().required(),
      HU: Joi.string().required(),
      LB: Joi.string().required(),
      SI: Joi.string().required(),
      SN: Joi.string().required(),
      TG: Joi.string().required(),
      unmarked: Joi.string().required(),
    }),
    errorMessages: Joi.object()
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
      "error.permitTypeOption.any.required": Joi.string().required(),
      "error.permitTypeOption.any.only": Joi.string().required()
    })
  }).required(),
  otherPermitType: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    radioOptionMIC: Joi.string().required(),
    radioOptionTEC: Joi.string().required(),
    radioOptionPOC: Joi.string().required(),
    radioOptionSemiComplete: Joi.string().required(),
    radioOptionDraft: Joi.string().required(),
    radioOptionOther: Joi.string().required(),
    errorMessages: Joi.object({
      "error.otherPermitTypeOption.any.required": Joi.string().required(),
      "error.otherPermitTypeOption.any.only": Joi.string().required()
    })
  }).required(),
  cannotUseService: Joi.object({
    pageTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody: Joi.string().required(),
    bullet1: Joi.string().required(),
    bullet2: Joi.string().required(),
    bullet3: Joi.string().required(),
    bullet4: Joi.string().required(),
    pageBody2: Joi.string().required(),
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
  selectAddress: Joi.object({
    common: Joi.object({
      defaultTitle: Joi.string().required(),
      pageHeader: Joi.string().required(),
      selectLabelAddress: Joi.string().required(),
      inputLabelDeliveryName: Joi.string().required(),
      inputHintDeliveryName: Joi.string().required(),
      selectAddressPromptNoResults: Joi.string().required(),
      selectAddressPromptSingle: Joi.string().required(),
      selectAddressPromptMultiple: Joi.string().required(),
      changePostcodeLinkText: Joi.string().required(),
      errorMessages: Joi.object({
        "error.address.string.empty": Joi.string().required(),
        "error.deliveryName.string.max": Joi.string().required(),
        "error.deliveryName.string.pattern.base": Joi.string().required()
      }).required()
    }).required(),
    agent: selectAddressSchema,
    applicant: selectAddressSchema,
    agentLed: selectAddressSchema,
    delivery: selectAddressSchema
  }).required(),
  enterAddress: Joi.object({
    common: Joi.object({
      inputLabelDeliveryName: Joi.string().required(),
      inputHintDeliveryName: Joi.string().required(),
      inputLabelAddressLine1: Joi.string().required(),
      inputLabelAddressLine2: Joi.string().required(),
      inputLabelAddressLine3: Joi.string().required(),
      inputLabelAddressLine4: Joi.string().required(),
      inputLabelPostcode: Joi.string().required(),
      inputLabelCountry: Joi.string().required(),
      errorMessages: Joi.object({
        "error.deliveryName.string.max": Joi.string().required(),
        "error.deliveryName.string.pattern.base": Joi.string().required(),
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
    inputLabelDeliveryName: Joi.string().required(),
    radioOptionDeliverToDifferentAddress: Joi.string().required(),
    errorMessages: Joi.object({
      "error.deliveryAddressOption.any.required": Joi.string().required(),
      "error.deliveryAddressOption.any.only": Joi.string().required(),
      "error.deliveryName.string.max": Joi.string().required(),
      "error.deliveryName.string.pattern.base": Joi.string().required()
    }).required()
  }).required(),
  deliveryType: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    hintText: Joi.string().required(),
    radioOptionStandardDelivery: Joi.string().required(),
    radioOptionSpecialDelivery: Joi.string().required(),
    errorMessages: Joi.object({
      "error.deliveryType.any.required": Joi.string().required()
    }).required()
  }).required(),
  speciesName: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    inputLabelSpeciesName: Joi.string().required(),
    errorMessages: Joi.object({
      "error.speciesName.string.empty": Joi.string().required()
    }).required(),
    javascriptBody: Joi.object({
      bodyText1: Joi.string().required(),
      bodyText2: Joi.string().allow("", null),
      bodyText3: Joi.string().allow("", null),
    }).required(),
    noJavascriptBody: Joi.object({
      bodyText1: Joi.string().required(),
      bodyText2: Joi.string().allow("", null),
      bodyText3: Joi.string().allow("", null),
    }).required(),
  }).required(),
  couldNotConfirm: Joi.object({
    pageTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    bodyText1: Joi.string().required(),
    bodyText2: Joi.string().required(),
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
  specimenOrigin: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    hintText: Joi.string().required(),
    radioOptionA: Joi.string().required(),
    radioOptionB: Joi.string().required(),
    radioOptionC: Joi.string().required(),
    radioOptionD: Joi.string().required(),
    radioOptionE: Joi.string().required(),
    radioOptionF: Joi.string().required(),
    radioOptionG: Joi.string().required(),
    errorMessages: Joi.object({
      "error.specimenOrigin.any.required": Joi.string().required()
    }).required()
  }).required(),
  useCertificateFor: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    radioOptionLegallyAcquired: Joi.string().required(),
    radioOptionCommercialActivities: Joi.string().required(),
    radioOptionNonDetrimentalPurposes: Joi.string().required(),
    radioOptionDisplayWithoutSale: Joi.string().required(),
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
    pageBody: Joi.string().allow("", null),
    pageBody2: Joi.string().allow("", null),
    tradeTermCodeSelectDefault: Joi.string().required(),
    tradeTermCodeUnknown: Joi.string().required(),
    errorMessages: Joi.object({
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
      "error.createdDate.any.beforeMinDate": Joi.string().required(),
      "error.createdDate-day.any.empty": Joi.string().required(),
      "error.createdDate-day-month.any.empty": Joi.string().required(),
      "error.createdDate-day-year.any.empty": Joi.string().required(),
      "error.createdDate-month.any.empty": Joi.string().required(),
      "error.createdDate-month-year.any.empty": Joi.string().required(),
      "error.createdDate-year.any.empty": Joi.string().required(),
      "error.approximateDate.string.empty": Joi.string().required(),
      "error.approximateDate.string.max": Joi.string().required(),
      "error.createdDate.any.both": Joi.string().required(),
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
      "error.acquiredDate.any.beforeMinDate": Joi.string().required(),
      "error.acquiredDate-day.any.empty": Joi.string().required(),
      "error.acquiredDate-day-month.any.empty": Joi.string().required(),
      "error.acquiredDate-day-year.any.empty": Joi.string().required(),
      "error.acquiredDate-month.any.empty": Joi.string().required(),
      "error.acquiredDate-month-year.any.empty": Joi.string().required(),
      "error.acquiredDate-year.any.empty": Joi.string().required(),
      "error.acquiredDate.any.both": Joi.string().required(),
      "error.approximateDate.string.empty": Joi.string().required(),
      "error.approximateDate.string.max": Joi.string().required()
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
    radioOptionTag: Joi.string().required(),
    radioOptionDivider: Joi.string().required(),
    radioOptionUnmarked: Joi.string().required(),
    errorMessages: Joi.object({
      "error.uniqueIdentificationMarkType.any.required":
        Joi.string().required(),
      "error.uniqueIdentificationMarkType.any.only": Joi.string().required(),
      "error.inputCR.string.empty": Joi.string().required(),
      "error.inputCR.string.max": Joi.string().required(),
      "error.inputCR.string.min": Joi.string().required(),
      "error.inputCR.any.duplicate": Joi.string().required(),
      "error.inputCB.string.empty": Joi.string().required(),
      "error.inputCB.string.max": Joi.string().required(),
      "error.inputCB.string.min": Joi.string().required(),
      "error.inputCB.any.duplicate": Joi.string().required(),
      "error.inputHU.string.empty": Joi.string().required(),
      "error.inputHU.string.max": Joi.string().required(),
      "error.inputHU.string.min": Joi.string().required(),
      "error.inputHU.any.duplicate": Joi.string().required(),
      "error.inputLB.string.empty": Joi.string().required(),
      "error.inputLB.string.max": Joi.string().required(),
      "error.inputLB.string.min": Joi.string().required(),
      "error.inputLB.any.duplicate": Joi.string().required(),
      "error.inputMC.string.empty": Joi.string().required(),
      "error.inputMC.string.max": Joi.string().required(),
      "error.inputMC.string.min": Joi.string().required(),
      "error.inputMC.any.duplicate": Joi.string().required(),
      "error.inputOT.string.empty": Joi.string().required(),
      "error.inputOT.string.max": Joi.string().required(),
      "error.inputOT.string.min": Joi.string().required(),
      "error.inputOT.any.duplicate": Joi.string().required(),
      "error.inputSN.string.empty": Joi.string().required(),
      "error.inputSN.string.max": Joi.string().required(),
      "error.inputSN.string.min": Joi.string().required(),
      "error.inputSN.any.duplicate": Joi.string().required(),
      "error.inputTG.string.empty": Joi.string().required(),
      "error.inputTG.string.max": Joi.string().required(),
      "error.inputTG.string.min": Joi.string().required(),
      "error.inputTG.any.duplicate": Joi.string().required(),
      "error.inputSR.string.empty": Joi.string().required(),
      "error.inputSR.string.max": Joi.string().required(),
      "error.inputSR.string.min": Joi.string().required(),
      "error.inputSR.any.duplicate": Joi.string().required(),
      "error.inputSI.string.empty": Joi.string().required(),
      "error.inputSI.string.max": Joi.string().required(),
      "error.inputSI.string.min": Joi.string().required(),
      "error.inputSI.any.duplicate": Joi.string().required(),
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
    hintTextSex: Joi.string().required(),
    inputLabelDateOfBirth: Joi.string().required(),
    inputLabelUndeterminedSexReason: Joi.string().required(),
    checkboxLabelIsExactDateUnknown: Joi.string().required(),
    inputLabelApproximateDate: Joi.string().required(),
    inputLabelDescription: Joi.string().required(),
    inputHintDescription: Joi.string().required(),
    inputLabelMaleParentDetails: Joi.string().required(),
    inputLabelFemaleParentDetails: Joi.string().required(),
    inputHintMaleParentDetails: Joi.string().required(),
    inputHintFemaleParentDetails: Joi.string().required(),
    radioOptionSexMale: Joi.string().required(),
    radioOptionSexFemale: Joi.string().required(),
    radioOptionSexUndetermined: Joi.string().required(),
    errorMessages: Joi.object()
      .keys({
        "error.sex.any.required": Joi.string().required(),
        "error.sex.any.only": Joi.string().required(),
        "error.maleParentDetails.string.empty": Joi.string().required(),
        "error.maleParentDetails.string.min": Joi.string().required(),
        "error.maleParentDetails.string.max": Joi.string().required(),
        "error.maleParentDetails.string.pattern.base": Joi.string().required(),
        "error.femaleParentDetails.string.empty": Joi.string().required(),
        "error.femaleParentDetails.string.min": Joi.string().required(),
        "error.femaleParentDetails.string.max": Joi.string().required(),
        "error.femaleParentDetails.string.pattern.base": Joi.string().required(),
        "error.description.string.max": Joi.string().required(),
        "error.description.string.pattern.base": Joi.string().required(),
        "error.description.string.empty": Joi.string().required(),
        "error.description.string.min": Joi.string().required(),
        "error.dateOfBirth.any.future": Joi.string().required(),
        "error.dateOfBirth.any.invalid": Joi.string().required(),
        "error.dateOfBirth-day.number.base": Joi.string().required(),
        "error.dateOfBirth-month.number.base": Joi.string().required(),
        "error.dateOfBirth-year.number.base": Joi.string().required(),
        "error.dateOfBirth-day.any.empty": Joi.string().required(),
        "error.dateOfBirth-month.any.empty": Joi.string().required(),
        "error.dateOfBirth-year.any.empty": Joi.string().required(),
        "error.dateOfBirth-day-month.any.empty": Joi.string().required(),
        "error.dateOfBirth-day-year.any.empty": Joi.string().required(),
        "error.dateOfBirth-month-year.any.empty": Joi.string().required(),
        "error.dateOfBirth.any.beforeMinDate": Joi.string().required(),
        "error.dateOfBirth.any.both": Joi.string().required()
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
  breeder: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    errorMessages: Joi.object({
      "error.isBreeder.any.required": Joi.string().required()
    }).required()
  }).required(),
  everImportedExported: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    errorMessages: Joi.object({
      "error.isEverImportedExported.any.required": Joi.string().required()
    }).required()
  }).required(),
  multipleSpecimens: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody: Joi.string().required(),
    inputLabelIsMultipleSpecimens: Joi.string().required(),
    inputLabelNumberOfSpecimens: Joi.string().required(),
    radioOptionYes: Joi.string().required(),
    radioOptionNo: Joi.string().required(),
    errorMessages: Joi.object({
      "error.isMultipleSpecimens.any.required": Joi.string().required(),
      "error.numberOfSpecimens.any.empty": Joi.string().required(),
      "error.numberOfSpecimens.number.base": Joi.string().required(),
      "error.numberOfSpecimens.number.integer": Joi.string().required(),
      "error.numberOfSpecimens.number.min": Joi.string().required(),
      "error.numberOfSpecimens.number.unsafe": Joi.string().required(),
      "error.numberOfSpecimens.number.max": Joi.string().required()
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
    hintImportReexportA10: Joi.string().required(),
    headingReexportA10: Joi.string().required(),
    inputLabelCountry: Joi.string().required(),
    inputLabelPermitNumber: Joi.string().required(),
    inputLabelPermitIssueDate: Joi.string().required(),
    inputLabelHintPermitIssueDate: Joi.string().required(),
    dividerText: Joi.string().required(),
    checkboxLabelSameAsCountryOfOrigin: Joi.string().required(),
    checkboxLabelCountryOfOriginNotKnown: Joi.string().required(),
    headingCountryOfOrigin: Joi.string().required(),
    hintCountryOfOrigin: Joi.string().required(),
    errorMessages: Joi.object({
      "error.exportOrReexportCountry.string.empty": Joi.string().required(),
      "error.exportOrReexportCountry.any.empty": Joi.string().required(),
      "error.exportOrReexportCountry.any.required": Joi.string().required(),
      "error.exportOrReexportCountry.string.max": Joi.string().required(),
      "error.exportOrReexportPermitNumber.any.required": Joi.string().required(),
      "error.exportOrReexportPermitNumber.string.empty": Joi.string().required(),
      "error.exportOrReexportPermitNumber.string.pattern.base": Joi.string().required(),
      "error.exportOrReexportPermitNumber.string.min": Joi.string().required(),
      "error.exportOrReexportPermitNumber.string.max": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate.any.empty": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate.any.custom": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate.any.future": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate.any.invalid": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate.any.beforeMinDate": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-day.any.empty": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-day-month.any.empty": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-day-year.any.empty": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-month.any.empty": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-month-year.any.empty": Joi.string().required(),
      "error.exportOrReexportPermitIssueDate-year.any.empty": Joi.string().required(),
      "error.countryOfOrigin.string.empty": Joi.string().required(),
      "error.countryOfOrigin.any.empty": Joi.string().required(),
      "error.countryOfOrigin.any.required": Joi.string().required(),
      "error.countryOfOrigin.string.max": Joi.string().required(),
      "error.countryOfOriginPermitNumber.any.required": Joi.string().required(),
      "error.countryOfOriginPermitNumber.string.empty": Joi.string().required(),
      "error.countryOfOriginPermitNumber.string.pattern.base": Joi.string().required(),
      "error.countryOfOriginPermitNumber.string.min": Joi.string().required(),
      "error.countryOfOriginPermitNumber.string.max": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.custom": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.empty": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.future": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.invalid": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate.any.beforeMinDate": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-day.any.empty": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-day-month.any.empty": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-day-year.any.empty": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-month.any.empty": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-month-year.any.empty": Joi.string().required(),
      "error.countryOfOriginPermitIssueDate-year.any.empty": Joi.string().required(),
      "error.isExportOrReexportSameAsCountryOfOrigin.any.invalid": Joi.string().required()
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
    pageBody2a: Joi.string().required(),
    pageBody2b: Joi.string().required(),
    bulletList2Items: Joi.array().items(
      Joi.object().keys({ bulletListItem: Joi.string().required() })
    ),
    buttonUpload: Joi.string().required(),
    heading2: Joi.string().required(),
    spanNoFilesUploaded: Joi.string().required(),
    buttonDelete: Joi.string().required(),
    errorMessages: Joi.object({
      "error.fileUpload.hapi.filename.string.empty": Joi.string().required(),
      "error.fileUpload.hapi.headers.content-type.any.only":
        Joi.string().required(),
      "error.fileUpload.any.existing": Joi.string().required(),
      "error.fileUpload.any.maxfiles": Joi.string().required(),
      "error.fileUpload.upload.exception": Joi.string().required(),
      "error.file.delete.exception": Joi.string().required(),
      "error.fileUpload.any.filesize": Joi.string().required()
    }).required()
  }).required(),
  additionalInfo: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    headingRemarks: Joi.string().required(),
    inputHintRemarks: Joi.string().required(),
    headingInternalReference: Joi.string().required(),
    inputHintInternalReference: Joi.string().required(),
    errorMessages: Joi.object({
      "error.comments.string.max": Joi.string().required(),
      "error.comments.string.pattern.base": Joi.string().required(),
      "error.internalReference.string.max": Joi.string().required(),
      "error.internalReference.string.pattern.base": Joi.string().required(),
    }).required()
  }).required(),
  applicationSummary: Joi.object({
    defaultTitleCheck: Joi.string().required(),
    pageHeaderCheck: Joi.string().required(),
    defaultTitleCopy: Joi.string().required(),
    pageHeaderCopy: Joi.string().required(),
    defaultTitleView: Joi.string().required(),
    pageHeaderView: Joi.string().required(),
    textBreadcrumbs: Joi.string().required(),
    changeLinkText: Joi.string().required(),
    tagIncompleteText: Joi.string().required(),
    headerPermit: Joi.string().required(),
    rowTextPermitType: Joi.string().required(),
    headerYourContactDetails: Joi.string().required(),
    headerApplicantContactDetails: Joi.string().required(),
    headerExportOrReexporterContactDetails: Joi.string().required(),
    headerImporterContactDetails: Joi.string().required(),
    headerExporterContactDetails: Joi.string().required(),
    headerReexporterContactDetails: Joi.string().required(),
    headerArticle10ContactDetails: Joi.string().required(),
    hintIncomplete: Joi.string().required(),
    errorSummaryTitle: Joi.string().required(),
    rowTextFullName: Joi.string().required(),
    rowTextFullNameAgent: Joi.string().required(),
    rowTextBusinessName: Joi.string().required(),
    rowTextEmailAddress: Joi.string().required(),
    rowTextAddress: Joi.string().required(),
    rowTextDeliveryType: Joi.string().required(),
    rowTextStandardDelivery: Joi.string().required(),
    rowTextSpecialDelivery: Joi.string().required(),
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
    rowTextMaleParentDetails: Joi.string().required(),
    rowTextFemaleParentDetails: Joi.string().required(),
    rowTextOtherDescription: Joi.string().required(),
    rowTextAreYouTheBreeder: Joi.string().required(),
    rowTextA10SpecimenOrigin: Joi.string().required(),
    rowTextSpecimenOriginA: Joi.string().required(),
    rowTextSpecimenOriginB: Joi.string().required(),
    rowTextSpecimenOriginC: Joi.string().required(),
    rowTextSpecimenOriginD: Joi.string().required(),
    rowTextSpecimenOriginE: Joi.string().required(),
    rowTextSpecimenOriginF: Joi.string().required(),
    rowTextSpecimenOriginG: Joi.string().required(),
    rowTextA10CertificatePurpose: Joi.string().required(),
    rowTextLegallyAcquired: Joi.string().required(),
    rowTextCommercialActivities: Joi.string().required(),
    rowTextNonDetrimentalPurposes: Joi.string().required(),
    rowTextDisplayWithoutSale: Joi.string().required(),
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
    headerAdditionalInformation: Joi.string().required(),
    rowTextRemarks: Joi.string().required(),
    rowTextInternalReference: Joi.string().required(),
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
    rowTextSourceCodeU: Joi.string().required(),
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
    rowTextShowHide: Joi.string().required(),
    rowTextOtherSourceCode: Joi.string().required(),
    rowTextSameAsCountryOfOrigin: Joi.string().required(),
    returnToYourApplicationsLinkText: Joi.string().required(),
    areYouSure: Joi.object({
      permitType: areYouSureSchema,
      scientificName: areYouSureSchema,
      multipleSpecimens: areYouSureSchema,
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
    }).required()
  }).required(),
  yourSubmission: Joi.object({
    common: Joi.object({
      tableHeadScientificName: Joi.string(),
      tableHeadQuantity: Joi.string(),
      tableHeadUnitOfMeasurement: Joi.string(),
      rowTextUnitsOfMeasurementNoOfSpecimens: Joi.string().required(),
      rowTextUnitsOfMeasurementNoOfPiecesOrParts: Joi.string().required(),
      labelInternalReference: Joi.string().required()
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
        "error.areYouSure.part2.any.required": Joi.string().required()
      }).required()
    }).required(),
    areYouSurePermitType: areYouSureSchema
  }).required(),
  addApplication: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    radioOptionCopyPrevious: Joi.string().required(),
    radioOptionAddNew: Joi.string().required(),
    radioOptionNo: Joi.string().required(),
    errorMessages: Joi.object({
      "error.addApplication.any.required": Joi.string().required()
    }).required()
  }).required(),
  declaration: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBodyText1: Joi.string().required(),
    pageBodyText2: Joi.string().required(),
    pageBodyText3: Joi.string().required(),
    pageBodyTextAgent: Joi.string().required(),
    checkboxLabelIAgree: Joi.string().required(),
    errorMessages: Joi.object({
      "error.declaration.any.required": Joi.string().required()
    }).required()
  }).required(),
  mySubmissions: Joi.object({
    draftNotificationTitle: Joi.string().required(),
    draftNotificationHeader: Joi.string().required(),
    draftNotificationBody: Joi.string().required(),
    draftContinue: Joi.string().required(),
    draftDelete: Joi.string().required(),
    defaultTitle: Joi.string().required(),
    defaultTitleOrganisation: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageHeaderOrganisation: Joi.string().required(),
    inputLabelSearch: Joi.string().required(),
    linkTextClearSearch: Joi.string().required(),
    buttonStartNewApplication: Joi.string().required(),
    pageBodyNewApplicationFromPrevious: Joi.string().required(),
    heading1: Joi.string().required(),
    pageBodyPermitType: Joi.string().required(),
    pageBodyStatus: Joi.string().required(),
    pageBodySubmittedBy: Joi.string().required(),
    submittedByDescriptionMe: Joi.string().required(),
    buttonApplyFilters: Joi.string().required(),
    linkTextClearFilters: Joi.string().required(),
    rowTextReferenceNumber: Joi.string().required(),
    rowTextApplicationDate: Joi.string().required(),
    rowTextStatus: Joi.string().required(),
    pagebodyNoApplicationsFound: Joi.string().required(),
    pagebodyZeroApplication: Joi.string().required(),
    areYouSureDraftDelete: areYouSureSchema
  }).required(),
  payApplication: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody: Joi.string().required(),
    pageBody2: Joi.string().required(),
    pageHeader2: Joi.string().required(),
    radioOptionYes: Joi.string().required(),
    radioOptionNo: Joi.string().required(),
    headingPaymentAmount: Joi.string().required(),
    paymentDescription: Joi.string().required(),
    errorMessages: Joi.object({
      "error.payNow.any.required": Joi.string().required()
    }).required()
  }).required(),
  mySubmission: Joi.object({
    textBreadcrumbs: Joi.string().required(),
    tableHeadReferenceNumber: Joi.string().required(),
    tableHeadScientificName: Joi.string().required(),
    tableHeadInternalReference: Joi.string().required(),
    notificationHeader: Joi.string().required(),
    notificationContent: Joi.string().required(),
    pendingApplicationsBodyText: Joi.string().required()
  }).required(),
  applicationComplete: Joi.object({
    defaultTitle: Joi.string().required(),
    panelHeading: Joi.string().required(),
    panelText: Joi.string().required(),
    pageHeader: Joi.string().required(),
    paid: Joi.object({
      pageBody1: Joi.string().required(),
      pageBody2: Joi.string().required(),
      pageBody3: Joi.string().required()
    }).required(),
    notPaid: Joi.object({
      simple: Joi.object({
        pageBody1: Joi.string().required(),
        pageBodyWarning: Joi.string().allow("", null),
        pageBody2: Joi.string().allow("", null),
        pageBody3: Joi.string().allow("", null),
        pageBody4: Joi.string().allow("", null)
      }).required(),
      complex: Joi.object({
        pageBody1: Joi.string().required(),
        pageBodyWarning: Joi.string().allow("", null),
        pageBody2: Joi.string().allow("", null),
        pageBody3: Joi.string().allow("", null),
        pageBody4: Joi.string().allow("", null)
      }).required(),
    }).required()
  }).required(),
  paymentProblem: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody: Joi.string().required(),
    goBackAndTryAgainLinkText: Joi.string().required(),
    submitApplicationLinkText: Joi.string().required(),
    returnToYourApplicationsLinkText: Joi.string().required()
  }).required(),
  paymentSuccess: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    returnToYourApplicationsLinkText: Joi.string().required(),
  }).required(),
  privacy: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    heading1: Joi.string().required(),
    heading2: Joi.string().required(),
    heading3: Joi.string().required(),
    heading4: Joi.string().required(),
    heading5: Joi.string().required(),
    heading6: Joi.string().required(),
    heading7: Joi.string().required(),
    heading8: Joi.string().required(),
    heading9: Joi.string().required(),
    heading10: Joi.string().required(),
    heading11: Joi.string().required(),
    heading12: Joi.string().required(),
    pageBodyText1: Joi.string().required(),
    pageBodyText2: Joi.string().required(),
    pageBodyText3: Joi.string().required(),
    pageBodyText4: Joi.string().required(),
    bulletList1Items: Joi.array().items(
      Joi.object({
        bulletListItem: Joi.string().required(),
      })
    ),
    pageBodyText5: Joi.string().required(),
    pageBodyText6: Joi.string().required(),
    pageBodyText7: Joi.string().required(),
    pageBodyText8: Joi.string().required(),
    pageBodyText9: Joi.string().required(),
    pageBodyText10: Joi.string().required(),
    bulletList2Items: Joi.array().items(
      Joi.object({
        bulletListItem: Joi.string().required(),
      })
    ),
    pageBodyText11: Joi.string().required(),
    pageBodyText12: Joi.string().required(),
    pageBodyText13: Joi.string().required(),
    pageBodyText14: Joi.string().required(),
    pageBodyText15: Joi.string().required(),
    pageBodyText16: Joi.string().required(),
    pageBodyText17: Joi.string().required(),
    pageBodyText18: Joi.string().required(),
    pageBodyText19: Joi.string().required(),
    pageBodyText20: Joi.string().required(),
    pageBodyText21: Joi.string().required()
  }).required(),
  cookies: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    heading1: Joi.string().required(),
    pageBodyText1: Joi.string().required(),
    pageBodyText2: Joi.string().required(),
    pageBodyText3: Joi.string().required(),
    tableHeadName: Joi.string().required(),
    tableHeadPurpose: Joi.string().required(),
    tableHeadExpires: Joi.string().required(),
    tableRow1: Joi.string().required(),
    tableRow2: Joi.string().required(),
    tableRow3: Joi.string().required(),
    tableRow4: Joi.string().required(),
    tableRow5: Joi.string().required(),
    tableRow6: Joi.string().required(),
  }).required(),
  accessibility: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    heading1: Joi.string().required(),
    heading2: Joi.string().required(),
    heading3: Joi.string().required(),
    heading4: Joi.string().required(),
    heading5: Joi.string().required(),
    pageBodyText1: Joi.string().required(),
    pageBodyText2: Joi.string().required(),
    bulletList1Items: Joi.array().items(
      Joi.object({
        bulletListItem: Joi.string().required(),
      })
    ),
    pageBodyText3: Joi.string().required(),
    pageBodyText4: Joi.string().required(),
    pageBodyText5: Joi.string().required(),
    pageBodyText6: Joi.string().required(),
    bulletList2Items: Joi.array().items(
      Joi.object({
        bulletListItem: Joi.string().required(),
      })
    ),
    pageBodyText7: Joi.string().required(),
    pageBodyText8: Joi.string().required(),
    pageBodyText9: Joi.string().required(),
    pageBodyText10: Joi.string().required()
  }).required(),
  speciesWarning: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required()
  }).required(),
  guidanceCompletion: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    warningMessage: Joi.string().required()
  }).required(),
  draftSubmissionWarning: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody: Joi.string().required(),
    errorMessages: Joi.object({
      "error.areYouSure.any.required": Joi.string().required(),
    }).required()
  }).required(),
  help: Joi.object({
    defaultTitle: Joi.string().required(),
    pageHeader: Joi.string().required(),
    pageBody1: Joi.string().required(),    
    pageBody2: Joi.string().required(),   
    pageBody3: Joi.string().required()    
  }).required()
})

// Validate config
const { error, value } = schema.validate(textContent)

// Throw if config is invalid
if (error) {
  throw new Error(`The text-content.json file is invalid. ${error.message}`)
}

module.exports = value
