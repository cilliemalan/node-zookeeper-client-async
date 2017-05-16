const assert = require('chai').assert;
const zk = require('../');

describe('The AsyncClient', function () {

    let client = zk.createAsyncClient('127.0.0.1:2181');

    before(async function () {
        await client.connectAsync();
        await client.createAsync('/test');
    });

    it('should be able to create a path with no optional arguments', async function () {
        // arrange
        let path = `/test/test-${parseInt(Math.random() * 10000)}`;

        // act
        let result = await client.createAsync(path);

        // assert
        assert.equal(result, path);

        // cleanup
        await client.removeAsync(path);
    });

    after(async function () {
        await client.removeAsync('/test');
        await client.closeAsync();
    });
});
