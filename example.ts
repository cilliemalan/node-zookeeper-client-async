import zk from '.';


(async function main() {
    const client: zk.AsyncClient = zk.createAsyncClient('127.0.0.1:2181');

    // connect to the server
    await client.connectAsync();
    console.log('connected!');

    // create a node
    const rootPath: string = await client.mkdirpAsync('/test');
    console.log(`created ${rootPath}`);

    // add some ephemeral nodes
    await client.createAsync('/test/counter-', Buffer.from('first'), null, zk.CreateMode.EPHEMERAL_SEQUENTIAL);
    await client.createAsync('/test/counter-', Buffer.from('second'), null, zk.CreateMode.EPHEMERAL_SEQUENTIAL);

    // list the nodes
    const nodes: string[] = await client.getChildrenAsync('/test');

    // print stuff to console
    console.log(`${rootPath} has the children:`);
    await Promise.all(nodes.map(async node => {
        const data: zk.AsyncDataResult = await client.getDataAsync(`/test/${node}`);
        console.log(`  ${node}: ${data.data}`);
    }));

    // delete everything
    await client.rmrfAsync(rootPath);

    // shut down
    await client.closeAsync();
    console.log('disconnected');
})();
