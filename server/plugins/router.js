const routes = [].concat(
  // require('../routes/home'),
  require('../routes/cannot-use-service'),
  require('../routes/guidance-completion'),
  require('../routes/permit-type'),
  require('../routes/other-permit-type'),
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
  require('../routes/multiple-specimens'),
  require('../routes/has-unique-identification-mark'),
  require('../routes/unique-identification-mark'),
  require('../routes/describe-specimen'),
  require('../routes/describe-living-animal'),
  require('../routes/breeder'),
  require('../routes/importer-exporter'),
  require('../routes/already-have-a10'),
  require('../routes/ever-imported-exported'),
  require('../routes/quantity'),
  require('../routes/origin-permit-details'),
  require('../routes/country-of-origin-import'),
  require('../routes/import-permit-details'),
  require('../routes/export-permit-details'),
  require('../routes/additional-info'),
  require('../routes/add-export-permit'),
  require('../routes/importer-details'),
  require('../routes/application-summary'),
  require('../routes/your-submission'),
  require('../routes/upload-supporting-documents'),
  require('../routes/declaration'),
  require('../routes/my-submissions'),
  require('../routes/my-submission'),
  require('../routes/public'),
  require('../routes/healthcheck'),
  require('../routes/oidc'),
  require('../routes/govpay'),
  require('../routes/payment-problem'),
  require('../routes/payment-success'),
  require('../routes/profile'),
  require('../routes/pay-application'),
  require('../routes/application-complete'),
  require('../routes/privacy'),
  require('../routes/cookies'),
  require('../routes/cookie-problem'),
  require('../routes/accessibility'),
  require('../routes/species-warning'),
  require('../routes/draft-submission-warning'),
  require('../routes/add-application'),
  require('../routes/specimen-origin'),
  require('../routes/delivery-type'),
  require('../routes/help')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
