/*
* Add an `onPreResponse` listener to return error pages
*/

const { httpStatusCode } = require('../lib/constants')

module.exports = {
  plugin: {
    name: 'error-pages',
    register: (server, _options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (response.isBoom) {
          // An error was raised during
          // processing the request
          const statusCode = response.output.statusCode

          // In the event of 404
          // return the `404` view
          if (statusCode === httpStatusCode.NOT_FOUND) {
            return h.view('404').code(statusCode)
          }

          if (statusCode === httpStatusCode.PAYLOAD_TOO_LARGE) {
            return h.view('413').code(statusCode)
          }

          // Log the error
          request.log('error', {
            statusCode: statusCode,
            message: response.message,
            stack: response.data ? response.data.stack : response.stack
          })


          // The return the `500` view
          return h.view('500').code(statusCode)
        }
        return h.continue
      })
    }
  }
}
