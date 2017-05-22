# node-zookeeper-client-async
A promises wrapper over [https://github.com/alexguan/node-zookeeper-client](https://github.com/alexguan/node-zookeeper-client)

For the most part it has each method included in the original node-zookeeper-client, with
each method with a callback having an additional `Async` variant (e.g. `createAsync`).

The symantics are slightly different in that operations on nonexistant nodes typically do
not reject (i.e. return an error), but rather resolve `null`.

## Documentation
For more specific information see [the documentation](https://cilliemalan.github.io/node-zookeeper-client-async)