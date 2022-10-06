const errors = {
    'error.permitType.any.required': 'Select the type of permit or certificate that you are applying for ',
    'error.isAgent.any.required' : 'Select yes if you are applying on behalf of someone else'
  }
  const lookupErrorText = (key) => {
    return errors[key] || key
  }
  
  module.exports = lookupErrorText
  