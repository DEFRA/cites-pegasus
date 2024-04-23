const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const { expect } = Code;
const { it, describe, before, after, beforeEach, afterEach } = exports.lab = Lab.script();
const { init } = require('../../../server')
const sinon = require('sinon')
const someModule = require('../../../server/services/dynamics-service')

describe('Healthcheck /get', () => {
    let server

    let mytestStub

    beforeEach(async () => {
        server = await init()

        // Stub the mytest function directly using the full module path
        mytestStub = sinon.stub(require('../../../server/services/dynamics-service'), 'mytest').callsFake(() => {
            console.log("Stubbed mytest called");
        });
    })

    afterEach(async () => {
        await server.stop()

        // Restore the original mytest function
        mytestStub.restore();
    })

    it('calls the correct functions on /healthcheck-detailed', { timeout: 30000 }, async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/healthcheck-detailed'
        })

        // Add logging to check if mytest is called
        console.log("Stub called: ", mytestStub.called);

        expect(mytestStub.calledOnce).to.be.true();
    })
    // let someMethodStub
    // before(async () => {
    //     server = await init()
    //     someMethodStub = sinon.stub(someModule, 'mytest').callsFake(() => {
    //         console.log("Stubbed mytest called");
    //     })
    // })

    // after(async () => {
    //     await server.stop()
    //     someMethodStub.restore()
    // })

    // it('responds with a success status on /healthcheck-basic', async () => {
    //     const response = await server.inject({
    //         method: 'GET',
    //         url: '/healthcheck-basic'
    //     })

    //     expect(response.statusCode).to.equal(200)
    //     expect(response.result).to.equal('Success'); // Or whatever content you expect
    //     expect(response.headers['content-type']).to.include('text/html')
    // })
    
    // it('responds with a success status on /healthcheck-detailed', async () => {
    //     const response = await server.inject({
    //         method: 'GET',
    //         url: '/healthcheck-detailed'
    //     })

    //     expect(response.statusCode).to.equal(200)
    //     expect(response.result).to.equal('Success'); // Or whatever content you expect
    //     expect(response.headers['content-type']).to.include('text/html')

    // })

    // it('calls the correct functions on /healthcheck-detailed', async () => {
    //     const response = await server.inject({
    //         method: 'GET',
    //         url: '/healthcheck-detailed'
    //     })

    //     //await someMethodStub();

    //     console.log("Stub called: ", someMethodStub.called);

    //     expect(someMethodStub.calledOnce).to.be.true()
    // })

});