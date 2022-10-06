module.exports = [{
  method: 'GET',
  path: '/apply-cites-permit',
  handler: (request, h) => {
    return h.view('apply-cites-permit', {
      pageTitle: 'Apply for a CITES permit',
      serviceName: 'Apply for a CITES permit'
    })
  }
},
{
  method: 'GET',
  path: '/',
  handler: (request, h) => {
    return h.redirect('apply-cites-permit')
  }
}]
