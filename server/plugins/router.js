const routes = [].concat(
  //require('../routes/home'),
  require('../routes/apply-cites-permit'),
  require('../routes/cannot-use-service'),
  require('../routes/permit-type'),
  require('../routes/applying-on-behalf'),
  require('../routes/contact-details'),
  require('../routes/postcode'),
  require('../routes/select-address'),
  require('../routes/species-name'),
  require('../routes/could-not-confirm'),
  require('../routes/enter-address'),
  require('../routes/purpose-code'),
  require('../routes/confirm-address'),
  require('../routes/source-code'),
  require('../routes/specimen-type'),
  require('../routes/select-delivery-address'),
  require('../routes/use-certificate-for'),
  require('../routes/trade-term-code'),
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
