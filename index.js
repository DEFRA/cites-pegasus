const createServer = require('./server')

createServer()
  .then(server => server.start())
  .then(server => console.log('###### CITES PORTAL STARTUP: Server started ######'))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
