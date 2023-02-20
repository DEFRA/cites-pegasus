const { Issuer } = require('openid-client');

async function createOpenIdClient() {
  const issuer = await Issuer.discover('https://condev5.azure.defra.cloud/idphub/b2c/.well-known/openid-configuration?p=b2c_1a_signupsignin');
  const client = new issuer.Client({
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    redirect_uris: ['https://your-app.com/callback'],
  });
  return client;
}

const client = createOpenIdClient()

module.exports = { client: client }