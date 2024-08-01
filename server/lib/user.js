const { enableFilterSubmittedBy, serviceRoleAdminUser } = require("../../config/config")
const { getYarValue, sessionKey } = require('../lib/session')

function hasOrganisationWideAccess(request) {
  const cidmAuth = getYarValue(request, sessionKey.CIDM_AUTH)

  return enableFilterSubmittedBy && cidmAuth.user.organisationName && cidmAuth.user.serviceRole === serviceRoleAdminUser
}


module.exports = {
  hasOrganisationWideAccess
}
