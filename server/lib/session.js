function setYarValue(request, key, value) {
  request.yar.set(key, value)

  if(key === 'changeRouteData') {     //TODO REMOVE THIS DEBUGGING CODE
      console.log(`${key}: ${JSON.stringify(value)}`)
  }
}

function getYarValue(request, key) {
  if (request.yar) {
    return request.yar.get(key)
  }
  return null
}

module.exports = {
  setYarValue,
  getYarValue
}
