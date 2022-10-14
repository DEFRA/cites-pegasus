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
  test: null
}

function setAppData(request, data) {
  const existingAppData = getAppData(request)
  const mergedAppData = { ...emptyAppData, ...existingAppData, ...data }
  setYarValue(request, 'appData', mergedAppData)
  console.log(mergedAppData);
}

module.exports = {
  setAppData,
  getAppData
}
