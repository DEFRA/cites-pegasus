const openid = require('openid-client');
const { readSecret } = require('../lib/key-vault')
const config = require('../../config/config')

async function getOpenIdClient() {
    // if (oidcClient) {
    //   return oidcClient;
    // }
  
    openid.custom.setHttpOptionsDefaults({
      timeout: 10000,
    });

    const clientId = (await readSecret('CIDM-API-CLIENT-ID')).value
    const clientSecret = (await readSecret('CIDM-API-CLIENT-SECRET')).value

    const cidmApiDiscoveryUrl = config.cidmApiDiscoveryUrl

    const issuer = await openid.Issuer.discover(cidmApiDiscoveryUrl);
    const clientCredentials = {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: ['https://localhost:3000/callback']
    };
    
    return new issuer.Client(clientCredentials);
}

module.exports = { getOpenIdClient }