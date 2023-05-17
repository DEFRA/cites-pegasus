const routes = [].concat(
  //require('../routes/home'),
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
  require('../routes/created-date'),
  require('../routes/acquired-date'),
  require('../routes/unique-identification-mark'),
  require('../routes/describe-specimen'),
  require('../routes/describe-living-animal'),
  require('../routes/importer-exporter'),
  require('../routes/already-have-a10'),
  require('../routes/ever-imported-exported'),
  require('../routes/unmarked-specimens'),
  require('../routes/quantity'),
  require('../routes/permit-details'),
  require('../routes/comments'),
  require('../routes/application-summary'),
  require('../routes/your-submission'),
  require('../routes/upload-supporting-documents'),
  require('../routes/declaration'),
  require('../routes/my-submissions'),
  require('../routes/my-submission'),
  require('../routes/public'),
  require('../routes/test'),
  require('../routes/oidc'),
  require('../routes/govpay'),
  require('../routes/payment-problem'),
  require('../routes/payment-success'),
  require('../routes/profile'),
  require('../routes/pay-application'),
  require('../routes/application-complete')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
