
// Mocking the mytest function
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
    })    

    describe('the healthcheck-detailed route', () => {
        beforeEach(() => {
            route = routes.find(controller => controller.path === '/healthcheck-detailed')            
        })
        test('has a method of GET', () => {
            expect(route.method).toEqual('GET')
        })
        describe('the handler when called', () => {
            beforeEach(async () => {
                keyVault.readSecret = jest.fn().mockResolvedValue("mock secret")
                session.setYarValue = jest.fn().mockReturnValue("mock ret val 2")            
                blobStorageService.checkContainerExists = jest.fn().mockResolvedValue("mock ret val 3")         
                dynamicsService.whoAmI = jest.fn().mockResolvedValue("mock ret val")         
                request =  {
                    server: { mockServer: 'mock server'}
                }

                h = {
                    view: jest.fn(),
                    response: jest.fn().mockReturnValue({
                        code: jest.fn()
                    })
                }
                
                await route.handler(request, h)
            }, 20000)
            test('calls keyVault.readSecret',() => {
                expect(keyVault.readSecret.mock.calls.length).toBe(1)
                expect(keyVault.readSecret.mock.calls[0][0]).toEqual('REDIS-PASSWORD')
            })
            test('calls blobStorageService.checkContainerExists',() => {
                expect(blobStorageService.checkContainerExists.mock.calls.length).toBe(1)
                //expect(blobStorageService.checkContainerExists.mock.calls[0][0]).toEqual(request.server)
            })
            test('calls session.setYarValue',() => {
                expect(session.setYarValue.mock.calls.length).toBe(1)
                expect(session.setYarValue.mock.calls[0][0]).toEqual(request)
            })
            test('calls dynamicsService.whoAmI',() => {
                expect(dynamicsService.whoAmI.mock.calls.length).toBe(1)
                expect(dynamicsService.whoAmI.mock.calls[0][0]).toEqual(request.server)
            })
        })
    })    
    
});