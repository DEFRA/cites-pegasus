const Joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/profile',
  options: {
    auth: 'jwt'
  },
  handler: async (request, h) => {
    const { user } = request.auth.credentials;
    return `Hello, ${user}!`;
  }  
}]