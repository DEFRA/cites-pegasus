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

const sessionKey = {
  SUBMISSION: 'submission',
  CLONE_SOURCE: 'cloneSource',
  CIDM_AUTH: 'CIDMAuth',
  GOVPAY_PAYMENT_ROUTE: 'govpay-paymentRoute',
  MY_SUBMISSIONS_QUERY_URLS:  'mySubmissions-queryUrls',
  MY_SUBMISSIONS_FILTER_DATA: 'mySubmissions-filterData'
}

module.exports = {
  setYarValue,
  getYarValue,
  clearYarSession,
  sessionKey
}
