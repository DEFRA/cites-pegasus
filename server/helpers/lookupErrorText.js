const errors = {
    'error.permitType.any.required': 'Select the type of permit or certificate that you are applying for ',
    'error.isAgent.any.required' : 'Select yes if you are applying on behalf of someone else',
    'error.fullName.string.empty' : 'Full name is required',
    'error.fullName.string.pattern.base' : 'Full name is invalid',
    'error.businessName.string.pattern.base' : 'Business name is invalid',
    'error.email.string.email' : 'Email format is invalid',
    'error.postcode.string.empty' : 'Enter your postcode',
    'error.postcode.string.pattern.base' : 'Enter a real postcode',
    'error.speciesName.string.empty'  : 'Enter the scientific name',
    'error.unitOfMeasurement.string.empty' : 'Select the unit of measurement',
    'error.quantity.number.base' : 'Enter the quantity using numbers 0 to 9',
    'error.quantity.number.min' : 'Quantity must be 1 or more',
    'error.quantity.number.max' : 'Quantity must be 99 or fewer'
  }
  const lookupErrorText = (key) => {
    return errors[key] || key
  }
  
  module.exports = lookupErrorText
  