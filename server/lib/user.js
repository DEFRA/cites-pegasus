const { enableFilterSubmittedBy, serviceRoleAdminUser } = require("../../config/config")
const { getYarValue, setYarValue } = require('../lib/session')

function hasOrganisationWideAccess(request) {
  const cidmAuth = getYarValue(request, 'CIDMAuth')

  return enableFilterSubmittedBy && cidmAuth.user.organisationName && cidmAuth.user.serviceRole === serviceRoleAdminUser
}


module.exports = {
  hasOrganisationWideAccess
}
