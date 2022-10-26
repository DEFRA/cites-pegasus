const routes = [].concat(
  //require('../routes/home'),
  require('../routes/apply-cites-permit'),
  require('../routes/cannot-use-service'),
  require('../routes/permit-type'),
  require('../routes/agent'),
  require('../routes/contact-details'),
  require('../routes/postcode'),
  require('../routes/public'),
  require('../routes/test')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
