jest.mock('../../../server/lib/key-vault')
jest.mock('../../../server/services/blob-storage-service')
jest.mock('../../../server/lib/session')
jest.mock('../../../server/services/dynamics-service')

const blobStorageService = jest.requireMock('../../../server/services/blob-storage-service.js')
const keyVault = jest.requireMock('../../../server/lib/key-vault.js')
const session = jest.requireMock('../../../server/lib/session.js')
const dynamicsService = jest.requireMock('../../../server/services/dynamics-service.js')
const router = require('../../../server/plugins/router')

let server
let routes
let route
let request
let code

describe('Healthcheck Routes', () => {

    beforeEach(async () => {
        server = {
            route: jest.fn()
        }
        router.plugin.register(server)
        routes = server.route.mock.calls[0][0]
    });

    describe('the healthcheck-basic route', () => {
        beforeEach(() => {
            route = routes.find(controller => controller.path === '/healthcheck-basic')            
        })
        test('has a method of GET', () => {
            expect(route.method).toEqual('GET')            
        })
        test('has no authentication', () => {
            expect(route.config.auth).toEqual(false)
        })        
        describe('the handler when called', () => {
            beforeEach(async () => {
                request =  {
                    server: { mockServer: 'mock server'}
                }
 
                code = jest.fn()
                
                h = {
                        response: jest.fn().mockReturnValue({
                        code: code
                    })
                }                
                
            }, 20000)
            test('returns Success', async () => {
                await route.handler(request, h)
                expect(h.response.mock.calls[0][0]).toContain('Success')
                expect(code.mock.calls[0][0]).toEqual(200)
            })
        })
    })    

    describe('the healthcheck-detailed route', () => {
        beforeEach(() => {
            route = routes.find(controller => controller.path === '/healthcheck-detailed')            
        })
        test('has a method of GET', () => {
            expect(route.method).toEqual('GET')            
        })
        test('has no authentication', () => {
            expect(route.config.auth).toEqual(false)
        })
        describe('the handler when called', () => {
            beforeEach(async () => {
                keyVault.readSecret = jest.fn()
                session.setYarValue = jest.fn()
                blobStorageService.listContainerNames = jest.fn().mockReturnValue([])
                dynamicsService.whoAmI = jest.fn()
                request =  {
                    server: { mockServer: 'mock server'}
                }

                code = jest.fn()
                
                h = {

                    view: jest.fn(),
                    response: jest.fn().mockReturnValue({
                        code: code
                    })
                }                
                
            }, 20000)
            test('returns Success', async () => {
                await route.handler(request, h)
                expect(h.response.mock.calls[0][0]).toEqual('Success')
                expect(code.mock.calls[0][0]).toEqual(200)
            })
            test('calls keyVault.readSecret', async () => {
                await route.handler(request, h)
                expect(keyVault.readSecret.mock.calls.length).toEqual(1)
                expect(keyVault.readSecret.mock.calls[0][0]).toEqual('REDIS-PASSWORD')
            })
            test('calls blobStorageService.listContainerNames', async () => {
                await route.handler(request, h)
                expect(blobStorageService.listContainerNames.mock.calls.length).toEqual(1)
                expect(blobStorageService.listContainerNames.mock.calls[0][0]).toBe(request.server)
            })
            test('calls session.setYarValue', async () => {
                await route.handler(request, h)
                expect(session.setYarValue.mock.calls.length).toEqual(1)
                expect(session.setYarValue.mock.calls[0][0]).toEqual(request)
            })
            test('calls dynamicsService.whoAmI', async () => {
                await route.handler(request, h)
                expect(dynamicsService.whoAmI.mock.calls.length).toEqual(1)
                expect(dynamicsService.whoAmI.mock.calls[0][0]).toBe(request.server)
            })
            test('returns error message for keyVault.readSecret exception', async () => {
                keyVault.readSecret.mockRejectedValue(new Error('KeyVault Error'));
                await route.handler(request, h);
                expect(h.response.mock.calls[0][0]).toEqual('Error calling key vault')
                expect(code.mock.calls[0][0]).toEqual(500)                
            })    
            test('returns error message for session.setYarValue exception', async () => {
                session.setYarValue.mockImplementation(() => { throw new Error('Session Error') })
                await route.handler(request, h)
                expect(h.response.mock.calls[0][0]).toEqual('Error calling redis session')
                expect(code.mock.calls[0][0]).toEqual(500)
            })
            test('returns error message for blobStorageService.listContainerNames exception', async () => {
                blobStorageService.listContainerNames.mockImplementation(() => { throw new Error('BlobStorage Error') })
                await route.handler(request, h)
                expect(h.response.mock.calls[0][0]).toEqual('Error calling blob storage')
                expect(code.mock.calls[0][0]).toEqual(500)
            })
    
            test('returns error message for dynamicsService.whoAmI exception', async () => {
                dynamicsService.whoAmI.mockImplementation(() => { throw new Error('Dynamics Error') })
                await route.handler(request, h)
                expect(h.response.mock.calls[0][0]).toEqual('Error calling dynamics service')
                expect(code.mock.calls[0][0]).toEqual(500)
            })            
        })
    })    
})
