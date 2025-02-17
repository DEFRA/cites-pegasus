const openid = require('openid-client')
const { readSecret } = require('../lib/key-vault')
const { cidmApiDiscoveryUrl, cidmCallbackUrl } = require('../../config/config')

async function getOpenIdClient () {
  openid.custom.setHttpOptionsDefaults({
    timeout: 10000
  })

  const clientId = (await readSecret('CIDM-API-CLIENT-ID')).value
  const clientSecret = (await readSecret('CIDM-API-CLIENT-SECRET')).value

  const issuer = await openid.Issuer.discover(cidmApiDiscoveryUrl)
  const clientCredentials = {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [cidmCallbackUrl]
  }

  const client = new issuer.Client(clientCredentials)
  client[openid.custom.clock_tolerance] = 10
  return client
}

module.exports = { getOpenIdClient }
