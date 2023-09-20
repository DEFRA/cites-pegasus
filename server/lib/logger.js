const appInsights = require('applicationinsights')

function log(message, data) {
    console.error(message)
    if(data){
        console.log(data)
    }
    //appInsights.defaultClient.trackEvent({ name: message, properties: data })
}

module.exports = { log }