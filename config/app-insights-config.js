const appInsights = require('applicationinsights')
const config = require('./config')

function configureAppInsights() {
  if(config.appInsightsInstrumentationKey && config.appInsightsInstrumentationCloudRole) {
    appInsights.setup(config.appInsightsInstrumentationKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = config.appInsightsInstrumentationCloudRole
    appInsights.start()
    console.info(`Application insights enabled with key: ${config.appInsightsInstrumentationKey}`)
  } else {
    console.info('Application insights disabled')
  }
}

module.exports = { configureAppInsights }