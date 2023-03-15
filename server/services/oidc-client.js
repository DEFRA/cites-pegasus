const openid = require('openid-client');

async function getOpenIdClient() {
    // if (oidcClient) {
    //   return oidcClient;
    // }
  
    openid.custom.setHttpOptionsDefaults({
      timeout: 10000,
    });
    const issuer = await openid.Issuer.discover('https://condev5.azure.defra.cloud/idphub/b2c/b2c_1a_signupsignin/.well-known/openid-configuration');
    const clientCredentials = {
      client_id: 'f566829d-3826-4ec7-9af9-e1229c5f6c25',
      client_secret: 'bVQ8Q~8tDWwLk4sP6FPWmNnXQn4C6NTgjgH3fda7',
      redirect_uris: ['https://localhost:3000/callback']
    };
    
    return new issuer.Client(clientCredentials);
}

module.exports = { getOpenIdClient }