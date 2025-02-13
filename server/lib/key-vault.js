const { SecretClient } = require('@azure/keyvault-secrets')
const { DefaultAzureCredential } = require('@azure/identity')
const config = require('../../config/config')

function readSecret (secretName) {
  const url = config.keyVaultUri
  const credential = new DefaultAzureCredential()

  const client = new SecretClient(url, credential)
  return client.getSecret(secretName)
}

module.exports = { readSecret }
