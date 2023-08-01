function setYarValue(request, key, value) {
  request.yar.set(key, value)
}

function getYarValue(request, key) {
  if (request.yar) {
    return request.yar.get(key)
  }
  return null
}

function clearYarSession(request) {
  request.yar.reset()
}

module.exports = {
  setYarValue,
  getYarValue,
  clearYarSession
}
