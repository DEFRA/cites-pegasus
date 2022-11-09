const errors = {
    'error.permitType.any.required': 'Select the type of permit or certificate that you are applying for ',
    'error.isAgent.any.required' : 'Select yes if you are applying on behalf of someone else',
    'error.fullName.string.empty' : 'Full name is required',
    'error.fullName.string.pattern.base' : 'Full name is invalid',
    'error.businessName.string.pattern.base' : 'Business name is invalid',
    'error.email.string.email' : 'Email format is invalid',
    'error.postcode.string.empty' : 'Enter your postcode',
    'error.postcode.string.pattern.base' : 'Enter a real postcode'    
  }
  const lookupErrorText = (key) => {
    return errors[key] || key
  }
  
  module.exports = lookupErrorText
  