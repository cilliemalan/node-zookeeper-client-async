const assert = require('chai').assert;
const zk = require('../');

describe('The AsyncClient', function () {
    it('should connect without options (createAsyncClient)', async function () {
        const client = zk.createAsyncClient("127.0.0.1:2181");
        await client.connectAsync();

        assert.equal(client.getState(), zk.State.SYNC_CONNECTED);

        await client.closeAsync();
    });

    it('should connect without options (AsyncClient with createClient)', async function () {
        const zkclient = zk.createClient("127.0.0.1:2181");
        const client = new zk.AsyncClient(zkclient);
        await client.connectAsync();

        assert.equal(client.getState(), zk.State.SYNC_CONNECTED);

        await client.closeAsync();
    });
    
    it('should connect and disconnect', async function () {
        const client = zk.createAsyncClient("127.0.0.1:2181");
        await client.connectAsync();
        await client.closeAsync();

        assert.equal(client.getState(), zk.State.DISCONNECTED);
    });
    
    it('should multi disconnect', async function () {
        const client = zk.createAsyncClient("127.0.0.1:2181");
        await client.connectAsync();
        await client.closeAsync();
        await client.closeAsync();

        assert.equal(client.getState(), zk.State.DISCONNECTED);
    });
});
