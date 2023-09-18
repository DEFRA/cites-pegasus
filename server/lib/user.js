const { enableFilterSubmittedBy } = require("../../config/config")
const { getYarValue, setYarValue } = require('../lib/session')

function hasOrganisationWideAccess(request) {
  const cidmAuth = getYarValue(request, 'CIDMAuth')

  if(enableFilterSubmittedBy && cidmAuth.user.organisationName) {
    return true   //TODO NEED TO ALSO CHECK THAT THE USER IS AN ADMIN USER
  }
  return false  
}


module.exports = {
  hasOrganisationWideAccess
}
