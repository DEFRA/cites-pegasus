const onPreResponse = {
  name: 'onPreResponse',
  version: '1.0.0',
  register: async function (server, _options) {
    server.ext('onPreResponse', (request, h) => {
      const response = request.response

      // const cspWithoutNonce =
      // `default-src 'self'; ` +
      // `style-src 'self' 'unsafe-inline'; ` +
      // `script-src 'self' 'unsafe-inline' 'unsafe-eval' www.googletagmanager.com; ` +
      // `img-src 'self' www.googletagmanager.com; ` +
      // `connect-src 'self' www.googletagmanager.com;`

      // const nonce = crypto.randomBytes(16).toString('base64')
      // const cspWithNonce =
      // `default-src 'self'; ` +
      // `style-src 'self' 'unsafe-inline'; ` +
      // `script-src 'self' 'nonce-${nonce}'; ` +
      // `img-src 'self' www.googletagmanager.com; ` +
      // `connect-src 'self' www.googletagmanager.com;`

      if (!response.isBoom) {
        // Access-Control-Allow-Origin
        // Remove all X-Powered-By headers, all X-XSS-Protection headers.

        // response.header('Content-Security-Policy', cspWithNonce)
        response.header('X-Permitted-Cross-Domain-Policies', 'none')
        response.header('Referrer-Policy', 'no-referrer-when-downgrade') // Best Practice is to have the Referrer-Policy strict-origin-when-cross-origin instead of the current configuration - Low
        response.header('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
        // if(response.source?.compiled?.settings?.contentType === 'text/html' && response.source.context){ //Adds this cspNonce variable to all pages so that it can be accessed by the templates
        //     response.source.context.cspNonce = nonce
        // }
      }

      return h.continue
    })
  }
}

module.exports = onPreResponse
