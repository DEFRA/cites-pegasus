const securityHeadersPlugin = {
    name: 'securityHeadersPlugin',
    version: '1.0.0',
    register: async function (server, _options) {
        server.ext('onPreResponse', (request, h) => {
            const response = request.response

            if (!response.isBoom) {
                response.header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;")
                response.header('X-Permitted-Cross-Domain-Policies', 'none')
                response.header('Referrer-Policy', 'no-referrer-when-downgrade')
                response.header('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
            }

            return h.continue
        })
    }
}

module.exports = securityHeadersPlugin