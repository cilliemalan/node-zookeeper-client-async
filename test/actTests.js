const assert = require('chai').assert;
const zk = require('../');
const { ACL, ACLS, Permission, Id } = zk;

describe('The AsyncClient', function () {

    let client = zk.createAsyncClient('127.0.0.1:2181');

    before(async function () {
        client.addAuthInfo('ip', Buffer.from('127.0.0.1'));
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

        // cleanup
        await client.removeAsync(path);
    });

    it('should be able to get null ACL for a non-existing node', async function () {
        // arrange
        const path = `/test/a/z/b/c/e`;

        // act
        const info = await client.getACLAsync(path);

        // assert
        assert.notOk(info);
    });

    it('should be able to set ACL for an existing node', async function () {
        // arrange
        const path = `/test/test-${parseInt(Math.random() * 10000)}`;
        await client.createAsync(path);

        // act
        const info = await client.setACLAsync(path, [
            new ACL(
                Permission.ALL,
                new Id('ip', '127.0.0.1')
            )
        ]);

        // assert
        const acl = await client.getACLAsync(path);
        assert.isOk(info);

        // cleanup
        await client.removeAsync(path);
    });

    after(async function () {
        await client.rmrfAsync('/test');
        await client.closeAsync();
    });
});
