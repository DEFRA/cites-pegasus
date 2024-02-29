module.exports = [{
  method: 'GET',
  path: '/robots.txt',
  options: { auth: false },
  handler: {
    file: 'server/public/static/robots.txt'
  }
}, {
  method: 'GET',
  path: '/assets/all.js',
  options: { auth: false },
  handler: {
    // file: 'node_modules/govuk-frontend/govuk/govuk-frontend.min.js'
    file: 'node_modules/govuk-frontend/govuk/all.js'
  }
}, {
  method: 'GET',
  path: '/assets/{path*}',
  options: { auth: false },
  handler: {
    directory: {
      path: [
        'server/public/static',
        'server/public/build',
        'node_modules/govuk-frontend/govuk/assets',
        'node_modules/accessible-autocomplete/dist'
      ]
    }
  }
}]
