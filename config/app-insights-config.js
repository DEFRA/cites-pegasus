const appInsights = require('applicationinsights')
const config = require('./config')

function configureAppInsights(server) {
  if (config.appInsightsInstrumentationKey && config.appInsightsInstrumentationCloudRole) {
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
    //Register a server extension point to log requests
    server.ext('onRequest', (request, h) => {
      const telemetry = { 
        name: request.method.toUpperCase() + ' ' + request.path, 
        url: request.path 
      }

      appInsights.defaultClient.trackRequest(telemetry)
      return h.continue
    })

    // Register a server extension point to log payload details
    server.ext('onPostAuth', (request, h) => {
      const telemetry = { 
        name: request.method.toUpperCase() + ' ' + request.path, 
        properties: {
                // Add custom properties
                method: request.method,
                headers: request.headers,
                query: request.query,
                payload: request.payload,
                // Add more details as needed
              },
        url: request.path 
      }

      appInsights.defaultClient.trackRequest(telemetry)
      return h.continue
    });
  
    // Register a server extension point to log responses
    server.ext('onPreResponse', (request, h) => {
      const telemetry = {
        name: request.method.toUpperCase() + ' ' + request.path,
        url: request.path,
        resultCode: request.response.statusCode,
        success: request.response.statusCode >= 200 && request.response.statusCode < 400,
      };
      appInsights.defaultClient.trackRequest(telemetry)
      return h.continue
    });
  
    // Register a server extension point to log exceptions
    server.ext('onPreResponse', (request, h) => {
      if (request.response instanceof Error) {
        const telemetry = {
          exception: request.response,
          properties: {
            requestPath: request.path,
          },
        };
        appInsights.defaultClient.trackException(telemetry)
      }
      return h.continue
    })

    console.info(`Application insights enabled with key: ${config.appInsightsInstrumentationKey}`)
  } else {
    console.info('Application insights disabled')
  }
}

module.exports = { configureAppInsights }