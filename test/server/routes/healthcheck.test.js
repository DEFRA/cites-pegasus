const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const { expect } = Code;
const { it, describe, before, after } = exports.lab = Lab.script();
const { init } = require('../../../server/')
const jest = require('jest')

describe('Healthcheck /get', () => {
    let server;

    before(async () => {
        server = await init();
    });

    after(async () => {
        await server.stop();
    });

    it('responds with a success status on /healthcheck-basic', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/healthcheck-basic'
        })

        expect(response.statusCode).to.equal(200)
        expect(response.result).to.equal('Success'); // Or whatever content you expect
        expect(response.headers['content-type']).to.include('text/html')
    });
    
    it('responds with a success status on /healthcheck-detailed', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/healthcheck-detailed'
        })

        expect(response.statusCode).to.equal(200)
        expect(response.result).to.equal('Success'); // Or whatever content you expect
        expect(response.headers['content-type']).to.include('text/html')
    });

    // it('responds with "Error calling key vault" on readSecret failure', async () => {
    //     // Mock readSecret directly inside the test
    //     jest.mock('../lib/key-vault', () => ({
    //       readSecret: jest.fn().mockRejectedValue(new Error('Error calling key vault'))
    //     }));
    
    //     const response = await server.inject({
    //       method: 'GET',
    //       url: '/healthcheck-detailed'
    //     });
    
    //     expect(response.statusCode).to.equal(500);
    //     expect(response.result).to.equal('Error calling key vault');
    //   });
});