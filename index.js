const zookeeper = require('node-zookeeper-client');
const State = zookeeper.State;
const ACL = zookeeper.ACL;
const CreateMode = zookeeper.CreateMode;
const Exception = zookeeper.Exception;


module.exports = Object.assign({}, zookeeper);

/**
 * An zookeeper client that has methods that return promises.
 */
class AsyncClient {

    /**
     * Creates a new AsyncClient for communicating with zookeeper. This object will
     * expose all the methods of the underlying zookeeper client, but also expose
     * a number of methods that return promises.
     * @param {Client} client the underlying zookeeper client created by createClient. 
     */
    constructor(client) {
        this._client = client;

        // this object has all the methods of the underlying client.
        for (let k in client) {
            const v = client[k];
            if (typeof v == 'function') this[k] = v.bind(client);
        }
    }

    /**
     * Initiate the connection to the provided server list (ensemble). The client will
     * pick an arbitrary server from the list and attempt to connect to it. If the
     * establishment of the connection fails, another server will be tried (picked
     * randomly) until a connection is established or close method is invoked.
     * @returns {Promise} resolves on connect. Rejects with message on failure.
     */
    connectAsync() {
        return new Promise((resolve, reject) => {
            this._client.once('connected', () => resolve());
            this._client.once('connectedReadOnly', () => resolve());
            this._client.once('authenticationFailed', () => reject('Authentication failed.'));
            this._client.once('disconnected', () => reject('Client disconnected before it could open a successful connection.'));
            this._client.connect();
        });
    }

    /**
     * Close this client. Once the client is closed, its session becomes invalid. All the
     * ephemeral nodes in the ZooKeeper server associated with the session will be
     * removed. The watchers left on those nodes (and on their parents) will be triggered.
     * Resolves true when the client disconnects, resolves false if the client is already
     * disconnected.
     * @returns {Promise} resolves when disconnected. Does not reject.
     */
    closeAsync() {
        return new Promise((resolve, reject) => {
            if (this._client.getState() == State.DISCONNECTED) {
                resolve(false);
            } else {
                this._client.once('disconnected', () => resolve(true));
                this._client.close();
            }
        });
    }

    /**
     * Create a node with given path, data, acls and mode. Resolves the path name if
     * successful, resolves false if the path already exists, and rejects for anything
     * else going wrong
     * @param {String} path Path of the node.
     * @param {Buffer} data The data buffer, optional, defaults to null.
     * @param {ACL} acls An array of ACL objects, optional, defaults to ACL.OPEN_ACL_UNSAFE.
     * @param {CreateMode} mode The creation mode, optional, defaults to CreateMode.PERSISTENT.
     * @returns {Promise} resolves with the path of the created item. Rejects with an error
     * if something goes wrong.
     */
    createAsync(path, data = null, acls = null, mode = null) {
        return new Promise((resolve, reject) => {
            this._client.create(path, data, acls, mode, (error, path) => {
                if (error) {
                    if (error == Exception.NODE_EXISTS) {
                        resolve(false);
                    } else {
                        reject(error);
                    }
                } else {
                    resolve(path);
                }
            });
        });
    }

    /**
     * Delete a node with the given path and version. If version is provided and not equal
     * to -1, the request will fail when the provided version does not match the server
     * version. Resolves true if the node is deleted. Resolves false if the node does
     * not exist. Rejects if the node has children, if the version does not match, or
     * for any other result.
     * @param {String} path Path of the node.
     * @param {Number} version The version of the node, optional, defaults to -1.
     * @returns {Promise}
     */
    removeAsync(path, version = -1) {
        return new Promise((resolve, reject) => {
            this._client.remove(path, version, e => {
                switch (e) {
                    case Exception.NO_NODE: resolve(false); break;
                    case undefined:
                    case 0:
                    case null:
                        resolve();
                        break;
                    default:
                        reject(e);
                        break;
                }
            });
        });
    }
}


function createAsyncClient(connectionString, options = null) {
    const clientInternal = zookeeper.createClient(connectionString, options);
    return new AsyncClient(clientInternal);
}

module.exports.createAsyncClient = createAsyncClient;
module.exports.AsyncClient = AsyncClient;