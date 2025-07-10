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
    file: 'node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.js'
  }
}, {
  method: 'GET',
  path: '/assets/{path*}',
  options: { auth: false },
  handler: {
    directory: {
      path: [
        'server/public/static',
        'public/build/stylesheets',
        'node_modules/govuk-frontend/dist/govuk/assets',
        'node_modules/accessible-autocomplete/dist'
      ]
    }
  }
}]
