const textContent = require('../content/text-content')
const { urlPrefix } = require('../../config/config')
const pageId = 'payment-success'
const currentPath = `${urlPrefix}/${pageId}`
const returnToYourApplicationsUrl = `${urlPrefix}/`

function createModel () {
  const commonContent = textContent.common
  const pageContent = textContent.paymentSuccess
  const notificationHeader = pageContent.pageHeader
  const notificationContent = `<a class='govuk-notification-banner__link' href='${returnToYourApplicationsUrl}'>${pageContent.returnToYourApplicationsLinkText}</a>`
  const pageTitle = pageContent.defaultTitle + commonContent.pageTitleSuffix
  return { ...commonContent, ...pageContent, notificationHeader, notificationContent, pageTitle }
}

module.exports = [{
  method: 'GET',
  path: `${currentPath}`,
  config: {
    auth: false,
    handler: async (_request, h) => {
      return h.view(pageId, createModel())
    }
  }
}]
