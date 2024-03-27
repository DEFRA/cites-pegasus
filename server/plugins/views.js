const path = require('path')
const nunjucks = require('nunjucks')
const config = require('../../config/config')
const pkg = require('../../package.json')
const analyticsAccount = config.analyticsAccount
const { common: commonContent } = require('../content/text-content')

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      html: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          options.compileOptions.environment = nunjucks.configure([
            path.join(options.relativeTo || process.cwd(), options.path),
            'node_modules/govuk-frontend/'
          ], {
            autoescape: true,
            watch: false
          })

          return next()
        }
      }
    },
    path: '../views',
    relativeTo: __dirname,
    isCached: !config.isDev,
    context: {
      appVersion: pkg.version,
      assetPath: '/assets',
      serviceName: 'Apply for a CITES permit',
      pageTitle: 'Apply for a CITES permit - GOV.UK',
      analyticsAccount: analyticsAccount,
      helpBarContent: {
        helpBarQuestion: commonContent.helpBarQuestion,
        helpBarLinkText: commonContent.helpBarLinkText
      }
    }
  }
}
