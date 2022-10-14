const Joi = require('@hapi/joi');
const textContent = require('./text-content.json');

// Define config schema
const schema = Joi.object().keys({
    common: Joi.object({
        serviceName: Joi.string().required(),
        backLinkButton: Joi.string().required(),
        continueButton: Joi.string().required(),
        startButton: Joi.string().required(),
        finishButton: Joi.string().required(),
        errorSummaryTitlePrefix: Joi.string().required(),
        errorSummaryTitle: Joi.string().required(),
        radioOptionYes: Joi.string().required(),
        radioOptionNo: Joi.string().required()
    }),
    applyCitesPermit:  Joi.object({
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
    cannotUseService:  Joi.object({
      pageTitle: Joi.string().required(),
      pageHeader: Joi.string().required(),
      pageBody: Joi.string().required(),
      bullet1: Joi.string().required(),
      bullet2: Joi.string().required(),
      linkText: Joi.string().required(),
      linkUrl: Joi.string().uri({allowRelative: true}).required(),
      finishButtonUrl: Joi.string().uri({allowRelative: true}).required()
    }),
    agent: Joi.object({
      defaultTitle: Joi.string().required(),
      radioHeaderAgent: Joi.string().required(),
      radioHeaderAgentHint: Joi.string().required()
    })
  })
  
  
  // Validate config
  const { error, value } = schema.validate(textContent)
  
  // Throw if config is invalid
  if (error) {
    throw new Error(`The text-content.json file is invalid. ${error.message}`)
  }
    
  module.exports = value
  