const { init } = require('../../../server')
const { urlPrefix } = require('../../../config/config')
const healthcheck = require('../../../server/routes/healthcheck');

// Mocking the mytest function
// jest.mock('../../../server/services/dynamics-service', () => ({
//     whoAmI: jest.fn(),
//     mytest: jest.fn(),
// }));

describe('Healthcheck Routes', () => {
    let server
    beforeAll(async () => {
        server = await init();
        await server.start();
      }, 30000);
    
      // Stop application after running the test case
      afterAll(async () => {
        await server.stop();
      });
    
    // beforeEach(() => {
    //     server = {
    //         server: 'mockServer',
    //     };
    // });

    // afterEach(() => {
    //     jest.clearAllMocks();
    // });

    test('should success with server connection', async function () {
        const options = {
            method: 'GET',
            url: '/healthcheck-basic'
        };
        const data = await server.inject(options);
        expect(data.statusCode).toBe(200);
        expect(data.payload).toBe('Success')
    });

    test('should success with server connection', async function () {
        const options = {
            method: 'GET',
            url: '/healthcheck-detailed'
        };
        const data = await server.inject(options);
        expect(data.statusCode).toBe(200);
        expect(data.payload).toBe('Success')
    });
//     it('should return success for healthcheck-basic', async () => {
//         const request = {};
//         const h = {
//             response: jest.fn(() => ({ code: jest.fn() })),
//         };
// const route = healthcheck.find(route => route.path === `${urlPrefix}/healthcheck-basic`)
//         const response = await route.handler(request, h);
//         expect(response).toBe('Success');  // Check the response directly
//         expect(h.response().code).toHaveBeenCalledWith(200);
//     });

    // it('should call mytest and whoAmI for healthcheck-detailed', async () => {
    //   const request = { server };
    //   const h = {
    //     response: jest.fn(() => ({ code: jest.fn() })),
    //   };

    //   await routes[1].handler(request, h);

    //   expect(mytest).toHaveBeenCalled();
    //   expect(whoAmI).toHaveBeenCalledWith(server);
    //   expect(h.response().code).toHaveBeenCalledWith(200);
    // });

    // it('should return error if calling dynamics service fails for healthcheck-detailed', async () => {
    //   const request = { server };
    //   const h = {
    //     response: jest.fn(() => ({ code: jest.fn() })),
    //   };

    //   mytest.mockImplementation(() => {
    //     throw new Error('Test error');
    //   });

    //   const result = await routes[1].handler(request, h);

    //   expect(result).toBe('Error calling dynamics service');
    //   expect(h.response().code).toHaveBeenCalledWith(500);
    // });
});