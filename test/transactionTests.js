const assert = require('chai').assert;
const zk = require('../');
const Transaction = zk.Transaction;


describe('The AsyncClient', function () {

    let client = zk.createAsyncClient('127.0.0.1:2181');

    before(async function () {
        await client.connectAsync();
        await client.createAsync('/test');
    });


    it('should be able to execute an async transaction without operations', async function () {

        // act
        const results = await client.transaction().commitAsync();

        // assert
        assert.isOk(results);
        assert.isArray(results);
        assert.equal(results.length, 0);
    });

    it('should be able to execute an async transaction with many operations', async function () {

        // arrange
        const path = `/test/test-${parseInt(Math.random() * 10000)}`;

        // act
        const results = await client.transaction()
            .create(`${path}`)
            .create(`${path}/1`)
            .create(`${path}/2`, Buffer.from('node2'))
            .create(`${path}/3`)
            .setData(`${path}/1`, Buffer.from('node1'))
            .check(`${path}/3`)
            .remove(`${path}/3`)
            .commitAsync();

        // assert
        assert.isOk(results);
        assert.isArray(results);
        assert.equal(results.length, 7);
        assert.deepEqual(results[0], { type: 1, path: `${path}` });
        assert.deepEqual(results[1], { type: 1, path: `${path}/1` });
        assert.deepEqual(results[2], { type: 1, path: `${path}/2` });
        assert.deepEqual(results[3], { type: 1, path: `${path}/3` });
        assert.equal(results[4].type, 5);
        assert.isOk(results[4].stat);
        assert.equal(results[4].stat.dataLength, 5);
        assert.deepEqual(results[5], { type: 13 });
        assert.deepEqual(results[6], { type: 2 });
        assert.isOk(await client.existsAsync(`${path}`));
        assert.isOk(await client.existsAsync(`${path}/1`));
        assert.isOk(await client.existsAsync(`${path}/2`));
        assert.isNotOk(await client.existsAsync(`${path}/3`));
        assert.equal((await client.getDataAsync(`${path}/1`)).data.toString(), 'node1');
        assert.equal((await client.getDataAsync(`${path}/2`)).data.toString(), 'node2');

        // cleanup
        client.rmrfAsync(`${path}`);
    });


    after(async function () {
        await client.rmrfAsync('/test');
        await client.closeAsync();
    });
});
