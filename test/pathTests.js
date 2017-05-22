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

    it('should throw if create fails', async function () {
        assert.throwsAsync(client.createAsync('/a/b/c/d/e'));
    });

    it('should be able to remove twice', async function () {
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

    it('should throw for invalid path', async function () {
        assert.throwsAsync(client.removeAsync('azz1240-a$5"/a/b/c/d/e'));
    });

    it('should throw if remove fails', async function () {
        // arrange
        let path1 = `/test/test-${parseInt(Math.random() * 10000)}`;
        let path2 = `${path1}/a`;
        await client.createAsync(path1);
        await client.createAsync(path2);

        // act/assert
        await assert.throwsAsync(client.removeAsync(path1));

        // cleanup
        await client.removeAsync(path2);
        await client.removeAsync(path1);
    });

    it('should successfully check if a path exists', async function () {

        // arrange 
        let path = `/test/test-${parseInt(Math.random() * 10000)}`;
        await client.createAsync(path);

        // act
        let exists = await client.existsAsync(path);

        // assert
        assert.isOk(exists);

        // cleanup
        await client.removeAsync(path);
    });

    it('should successfully check if a path does not exist', async function () {

        // arrange 
        let path = `/test/test-${parseInt(Math.random() * 10000)}`;

        // act
        let exists = await client.existsAsync(path);

        // assert
        assert.isNotOk(exists);

        // cleanup
        await client.removeAsync(path);
    });

    it('should successfully check if a nested path does not exist', async function () {

        // arrange 
        let path = `/test/a/b/d/e`;

        // act
        let exists = await client.existsAsync(path);

        // assert
        assert.isNotOk(exists);

        // cleanup
        await client.removeAsync(path);
    });

    it('should successfully check if a nested path does not exist', async function () {

        // arrange 
        let path = `/test/a/b/c`;

        // act
        let exists = await client.existsAsync(path);

        // assert
        assert.isNotOk(exists);

        // cleanup
        await client.removeAsync(path);
    });

    it('should retrieve children if a node has children', async function () {
        // arrange
        const root = `/test/test-${parseInt(Math.random() * 10000)}`;
        const children = [`${root}/a`, `${root}/b`, `${root}/c`];
        await client.createAsync(root);
        await Promise.all(children.map(p => client.createAsync(p)));

        // act
        const retrieved = await client.getChildrenAsync(root);

        // assert
        assert.isOk(retrieved);
        assert.equal(retrieved.length, children.length);
        assert.include(retrieved, 'a');
        assert.include(retrieved, 'b');
        assert.include(retrieved, 'c');
    });

    it('should retrieve no children if a node has no children', async function () {
        // arrange
        const root = `/test/test-${parseInt(Math.random() * 10000)}`;
        await client.createAsync(root);

        // act
        const retrieved = await client.getChildrenAsync(root);

        // assert
        assert.isOk(retrieved);
        assert.equal(retrieved.length, 0);
    });

    it('should retrieve null if a node does not exist', async function () {
        // arrange
        const root = `/test/test-${parseInt(Math.random() * 10000)}`;

        // act
        const retrieved = await client.getChildrenAsync(root);

        // assert
        assert.isNotOk(retrieved);
    });

    it('should be able to create deep folders with mkdirp', async function () {
        // arrange
        const root = `/test/test-${parseInt(Math.random() * 10000)}`;
        const path = `${root}/a/b/c`;

        // act
        const retrieved = await client.mkdirpAsync(path);

        // assert
        assert.equal(retrieved, path);
        assert.isOk(await client.existsAsync(`${root}`));
        assert.isOk(await client.existsAsync(`${root}/a`));
        assert.isOk(await client.existsAsync(`${root}/a/b`));
        assert.isOk(await client.existsAsync(`${root}/a/b/c`));

        // cleanup
        await client.rmrfAsync(root);
    });

    after(async function () {
        await client.rmrfAsync('/test');
        await client.closeAsync();
    });
});
