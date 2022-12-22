const routes = [].concat(
  //require('../routes/home'),
  require('../routes/apply-cites-permit'),
  require('../routes/cannot-use-service'),
  require('../routes/permit-type'),
  require('../routes/agent'),
  require('../routes/contact-details'),
  require('../routes/postcode'),
  require('../routes/select-address'),
  require('../routes/species-name'),
  require('../routes/enter-address'),
  require('../routes/purpose-code'),
  require('../routes/confirm-address'),
  require('../routes/source-code'),
  require('../routes/select-delivery-address'),
  require('../routes/public'),
  require('../routes/test'),
  require('../routes/oidc')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
