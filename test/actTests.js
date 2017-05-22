const assert = require('chai').assert;
const zk = require('../');

describe('The AsyncClient', function () {

    let client = zk.createAsyncClient('127.0.0.1:2181');

    before(async function () {
        await client.connectAsync();
        await client.createAsync('/test');
    });

    it('should be able to get ACL for an existing node', async function () {
        // arrange
        const path = `/test/test-${parseInt(Math.random() * 10000)}`;
        await client.createAsync(path);

        // act
        const info = await client.getACLAsync(path);

        // assert
        assert.isOk(info);
        assert.isOk(info.stat);
        assert.isOk(info.acls);
    });

    it('should be able to get null ACL for a non-existing node', async function () {
        // arrange
        const path = `/test/a/z/b/c/e`;

        // act
        const info = await client.getACLAsync(path);
        
        // assert
        assert.notOk(info);
    });

    after(async function () {
        await client.rmrfAsync('/test');
        await client.closeAsync();
    });
});
