function setYarValue(request, key, value) {
  request.yar.set(key, value)
}

function getYarValue(request, key) {
  if (request.yar) {
    return request.yar.get(key)
  }
  return null
}

function getAppData(request) {
  return getYarValue(request, 'appData') || emptyAppData
}

const emptyAppData = {
  permitType: null,
  isAgent: null,
  agentFullName: null,
  agentBusinessName: null,
  agentEmail: null,
  applicantFullName: null,
  applicantBusinessName: null,
  applicantEmail: null
}

function setAppData(request, data) {
  const existingAppData = getAppData(request)
  const mergedAppData = { ...emptyAppData, ...existingAppData, ...data }
  setYarValue(request, 'appData', mergedAppData)
  console.log(mergedAppData)//TODO Remove this
  return mergedAppData
}

function clearAppData(request) {
  setYarValue(request, 'appData', emptyAppData)
  console.log(emptyAppData)//TODO Remove this
}

module.exports = {
  setAppData,
  getAppData,
  clearAppData
}
