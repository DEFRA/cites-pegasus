const { urlPrefix } = require('../../config/config')
const session = require('../lib/session')
const blobStorageService = require('../services/blob-storage-service')
const keyVault = require('../lib/key-vault')
const dynamicsService = require('../services/dynamics-service')
const { httpStatusCode } = require('../lib/constants')

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/healthcheck-basic`,
    config: {
      auth: false
    },
    handler: async (_request, h) => {
      return h.response('Success').code(httpStatusCode.OK)
    }
  },
  {
    method: 'GET',
    path: `${urlPrefix}/healthcheck-detailed`,
    config: {
      auth: false
    },
    handler: async (request, h) => {
      try {
        console.log('#### HEALTHCHECK #### - Testing key vault connection...')
        await keyVault.readSecret('CIDM-API-CLIENT-ID')
        console.log('#### HEALTHCHECK #### - Key vault connection successful')
      } catch (err) {
        console.error('#### HEALTHCHECK #### - Key vault connection error')
        console.error(err)
        return h.response('Error calling key vault').code(httpStatusCode.INTERNAL_SERVER_ERROR)
      }

      try {
        console.log('#### HEALTHCHECK #### - Testing session cache connection...')
        session.setYarValue(request, 'test', Date.now())
        console.log('#### HEALTHCHECK #### - Session cache successful')
      } catch (err) {
        console.error('#### HEALTHCHECK #### - Session cache error')
        console.error(err)
        return h.response('Error testing session cache').code(httpStatusCode.INTERNAL_SERVER_ERROR)
      }

      try {
        console.log('#### HEALTHCHECK #### - Testing storage connection...')
        // await blobStorageService.checkContainerExists(request.server, 'test')
        console.log('Getting first 10 container names...')
        const containers = await blobStorageService.listContainerNames(request.server, 10)
        containers.forEach(container => {
          console.log('Container name: ' + container)
        })
        console.log('#### HEALTHCHECK #### - Storage connection successful')
      } catch (err) {
        console.error('#### HEALTHCHECK #### - Storage connection error')
        console.error(err)
        return h.response('Error calling blob storage').code(httpStatusCode.INTERNAL_SERVER_ERROR)
      }

      try {
        console.log('#### HEALTHCHECK #### - Testing dynamics connection...')
        await dynamicsService.whoAmI(request.server)
        console.log('#### HEALTHCHECK #### - Dynamics connection successful')
      } catch (err) {
        console.error('#### HEALTHCHECK #### - Dynamics connection error')
        console.error(err)
        return h.response('Error calling dynamics service').code(httpStatusCode.INTERNAL_SERVER_ERROR)
      }

      return h.response('Success').code(httpStatusCode.OK)
    }
  }]
