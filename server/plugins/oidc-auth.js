const jwtAuth = require('hapi-auth-jwt2');
const jwksClient = require('jwks-rsa');
const { decode } = require('jsonwebtoken');
const { client } = require('../services/oidc-client')

// async function validate(decoded, request) {
//   const jwksUri = 'https://accounts.example.com/.well-known/jwks.json';
//   const kid = decoded.header.kid;
//   const client = jwksClient({
//     jwksUri,
//   });
//   const key = await client.getSigningKeyAsync(kid);
//   const secret = key.publicKey || key.rsaPublicKey;
//   return { isValid: true, credentials: { user: decoded.sub } };
// }


async function validate(decoded, request) {
  const key = await client.getSigningKeyAsync(kid);
  const secret = key.publicKey || key.rsaPublicKey;
  return { isValid: true, credentials: { user: decoded.sub } };
}



module.exports = {
  plugin: {
    name: 'oidc-auth',
    register: (server, options) => {

      const authOptions = {
        key: 'your-secret-key',
        validate,
        verifyOptions: { algorithms: ['RS256'] },
      };

      server.register(jwtAuth)

      
      server.auth.strategy('jwt', 'jwt', authOptions);
      server.auth.default('jwt');

      


    }
  }
}