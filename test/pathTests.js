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

    it('should be able to create a path twice', async function () {
        // arrange
        let path = `/test/test-${parseInt(Math.random() * 10000)}`;

        // act
        let r1 = await client.createAsync(path);
        let r2 = await client.createAsync(path);

        // assert
        assert.isOk(r1);
        assert.isNotOk(r2);

        // cleanup
        await client.removeAsync(path);
    });

    it('should be able to delete twice', async function () {
        // arrange
        let path = `/test/test-${parseInt(Math.random() * 10000)}`;
        await client.createAsync(path);

        // act
        let r1 = await client.removeAsync(path);
        let r2 = await client.removeAsync(path);

        // assert
        assert.isTrue(r1);
        assert.isFalse(r2);
    });

    after(async function () {
        await client.removeAsync('/test');
        await client.closeAsync();
    });
});
