const { enableFilterSubmittedBy, serviceRoleAdminUser } = require("../../config/config")
const { getYarValue, setYarValue } = require('../lib/session')

function hasOrganisationWideAccess(request) {
  const cidmAuth = getYarValue(request, 'CIDMAuth')

  if(enableFilterSubmittedBy && cidmAuth.user.organisationName && cidmAuth.user.serviceRole === serviceRoleAdminUser) {
    return true
  }
  return false  
}


module.exports = {
  hasOrganisationWideAccess
}
