const Joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/profile',
  config: {
    // auth: false
    auth: 'jwt'
  },
  handler: async (request, h) => {
    //return 'Hello, ' + request.auth.credentials.name;

    const { user } = request.auth.credentials;
    return `Hello, ${user}!`;
  }  
}]