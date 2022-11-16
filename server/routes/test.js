const urlPrefix = require('../../config/config').urlPrefix
const pageId = 'test'
const Joi = require('joi')
const { whoAmI } = require('../services/dynamics-service')

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/test`,
    handler: async (request, h) => {
      //const authToken = await auth.getClientCredentialsToken()

      // const searchData = {
      //   //postcode: null,

      //   property: null,
      //   street: 'dfgfdf',
      //   town: 'x'
      // }

      // if(searchData.postcode && (searchData.property || searchData.street || searchData.town)){
      //   console.log('error both')
      // } else if(!searchData.postcode && !searchData.property && !searchData.street && !searchData.town){
      //   console.log('error neither')
      // } else {
      //   console.log('all good')
      // }


      // const schema = Joi.object({
      //   postcode: Joi.string(),
      //   property: Joi.string()
      //   // street: Joi.string().empty(),
      //   // town: Joi.string().empty()
      // }).or('property', 'postcode')


      // // Validate config
      // const { error, value } = schema.validate({postcode: 'abc', property: ''})

      // // Throw if config is invalid
      // if (error) {
      //   console.log(error)
      // } else {
      //   console.log('All good')
      // }

      return h.view(pageId, null);
    }
  },
  {
    method: 'POST',
    path: `${urlPrefix}/test`,
    handler: async (request, h) => {
      let response = null

      try {
        response = await whoAmI(request);
      }
      catch (err) {
        return h.code(500)
      }


      return h.view(pageId, { data: JSON.stringify(response) });
    }
  }]
