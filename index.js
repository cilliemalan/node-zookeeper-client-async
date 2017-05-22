const zookeeper = require('node-zookeeper-client');
const State = zookeeper.State;
const ACL = zookeeper.ACL;
const CreateMode = zookeeper.CreateMode;
const Exception = zookeeper.Exception;

// use bluebird promises if available
try {
    var bluebird = require('bluebird');
    if (bluebird) {
        global.Promise = bluebird.Promise;
    }
} catch (_) { }


module.exports = Object.assign({}, zookeeper);

/**
 * An asynchronous zookeeper transaction. Created by AsyncClient.transaction()
 */
class AsyncTransaction {
    constructor(transaction) {
        this._transaction = transaction;
    }

    /**
     * Add a create operation with given path, data, acls and mode.
     * @param {String} path Path of the node.
     * @param {Buffer} data The data buffer, optional, defaults to null.
     * @param {ACL[]} acls An array of ACL objects, optional, defaults to ACL.OPEN_ACL_UNSAFE
     * @param {CreateMode} mode The creation mode, optional, defaults to CreateMode.PERSISTENT
     * @returns {AsyncTransaction}
     */
    create(path, data = null, acls = null, mode = null) {
        this._transaction.create(path, data, acls, mode);
        return this;
    }

    /**
     * Add a set-data operation with the given path, data and optional version.
     * @param {string} path Path of the node.
     * @param {Buffer} data The data buffer, or null.
     * @param {number} version The version of the node, optional, defaults to -1.
     * @returns {AsyncTransaction}
     */
    setData(path, data, version = -1) {
        this._transaction.setData(path, data, version);
        return this;
    }

    /**
     * Add a check (existence) operation with given path and optional version.
     * @param {*} path Path of the node.
     * @param {*} version The version of the node, optional, defaults to -1.
     * @returns {AsyncTransaction}
     */
    check(path, version = -1) {
        this._transaction.check(path, version);
        return this;
    }

    /**
     * Add a delete operation with the given path and optional version.
     * @param {*} path Path of the node.
     * @param {*} version The version of the node, optional, defaults to -1.
     * @returns {AsyncTransaction}
     */
    remove(path, version = -1) {
        this._transaction.remove(path, version);
        return this;
    }

    /**
     * Execute the transaction atomically.
     * @param {Function} cb The callback function.
     */
    commit(cb) {
        this._transaction.commit(cb);
    }

    /**
     * Execute the transaction atomically. Resolves when the operation has completed,
     * rejects if anything goes wrong.
     * @returns {Promise}
     */
    commitAsync() {
        return new Promise((resolve, reject) => {
            this._transaction.commit((e, r) => {
                if (e) reject(e);
                else resolve(r);
            })
        });
    }
}

/**
 * A zookeeper client that has methods that return promises.
 * @example
 * const zk = require('node-zookeeper-client-async');
 * 
 * const client = zk.createAsyncClient("127.0.0.1:2181");
 * 
 * // connect to the server
 * await client.connectAsync();
 * console.log('connected!');
 * 
 * // create a node
 * const rootPath = await client.mkdirpAsync('/test');
 * console.log(`created ${rootPath}`)
 * 
 * // add some ephemeral nodes
 * await client.createAsync('/test/counter-', Buffer.from('first'), null, zk.CreateMode.EPHEMERAL_SEQUENTIAL);
 * await client.createAsync('/test/counter-', Buffer.from('second'), null, zk.CreateMode.EPHEMERAL_SEQUENTIAL);
 * 
 * // list the nodes
 * const nodes = await client.getChildrenAsync('/test');
 * 
 * // print stuff to console
 * console.log(`${rootPath} has the children:`)
 *     await Promise.all(nodes.map(async node => {
 *     const data = await client.getDataAsync(`/test/${node}`);
 *     console.log(`  ${node}: ${data.data}`);
 * }));
 * 
 * // delete everything
 * await client.rmrfAsync(rootPath);
 * 
 * // shut down
 * await client.closeAsync();
 * console.log('disconnected');
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
            if (k in AsyncClient.prototype) continue;

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
                    if (error.code == Exception.NODE_EXISTS) {
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
                switch (e && e.code) {
                    case Exception.NO_NODE: resolve(false); break;
                    case null:
                        resolve(true);
                        break;
                    default:
                        reject(e);
                        break;
                }
            });
        });
    }

    /**
     * For the given node path, retrieve the children list and the stat. The children will
     * be an unordered list of strings. Resolves the stat object if the node exists,
     * resolves null if it does not exist, rejects if anything goes wrong.
     * @param {string} path the Path of the node.
     * @returns {Promise}
     */
    existsAsync(path) {
        return new Promise((resolve, reject) => {
            this._client.exists(path, null, (e, stat) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(stat);
                }
            });
        });
    }

    /**
     * For the given node path, retrieve the children list and the stat. The children will
     * be an unordered list of strings. Resolved the children if the node exists, resolves
     * null if the node does not exist. Rejects if anything goes wrong.
     * @param {string} path the Path of the node.
     * @returns {Promise}
     */
    getChildrenAsync(path) {
        return new Promise((resolve, reject) => {
            this._client.getChildren(path, null, (e, children) => {
                if (e) {
                    if (e.code == Exception.NO_NODE) resolve(null);
                    else reject(e);
                } else {
                    resolve(children);
                }
            });
        });
    }

    /**
     * Retrieve the data and the stat of the node of the given path. Resolves an object
     * containing data as a Buffer object and stat as the stat object. Resolves null
     * if the node does not exist. Rejects if anything goes wrong.
     * @param {string} path the Path of the node.
     * @returns {Promise}
     */
    getDataAsync(path) {
        return new Promise((resolve, reject) => {
            this._client.getData(path, null, (e, data, stat) => {
                if (e) {
                    if (e.code == Exception.NO_NODE) resolve(null);
                    else reject(e);
                } else {
                    resolve({ data, stat });
                }
            });
        });
    }

    /**
     * Set the data for the node of the given path if such a node exists and the optional
     * given version matches the version of the node (if the given version is -1, it
     * matches any node's versions). Will resolve the stat of the node if successful. Will
     * reject if unsuccessful or if the node does not exist.
     * @param {string} path the Path of the node.
     * @param {Buffer} data the data to set on the node.
     * @param {Number} version the version to set. -1 (default) to match any version.
     * @returns {Promise}
     */
    setDataAsync(path, data, version = -1) {
        return new Promise((resolve, reject) => {
            this._client.setData(path, data, version, (e, stat) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(stat);
                }
            });
        });
    }

    /**
     * Retrieve the list of ACL and stat of the node of the given path. Will resolve an
     * object with acls as a list of ACL objects and stat as the stat for the node. Will
     * resolve null if the node does not exist and will reject if anything goes wrong.
     * @param {string} path the Path of the node.
     * @returns {Promise}
     */
    getACLAsync(path) {
        return new Promise((resolve, reject) => {
            this._client.getACL(path, (e, acls, stat) => {
                if (e) {
                    if (e.code == Exception.NO_NODE) resolve(null);
                    else reject(e);
                } else {
                    resolve({ stat, acls });
                }
            });
        });
    }

    /**
     * Set the ACL for the node of the given path if such a node exists and the given
     * version (optional) matches the version of the node on the server. (if the given
     * version is -1, it matches any versions). Will resolve on success and reject
     * if anything goes wrong or the node does not exist.
     * @param {string} path the Path of the node.
     * @param {ACL[]} acls An array of ACL instances to set on the node.
     * @param {Number} version the version to set. -1 (default) to match any version.
     */
    setACLAsync(path, acls, version = -1) {
        return new Promise((resolve, reject) => {
            this._client.setACL(path, acls, version, (e, stat) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(stat);
                }
            });
        });
    }

    /**
     * Create given path in a way similar to mkdir -p. Will resolve the path if the node
     * is created and will reject if anything goes wrong.
     * @param {string} path the Path of the node.
     * @param {Buffer} data The data buffer, optional, defaults to null.
     * @param {ACL[]} acls  array of ACL objects, optional, defaults to ACL.OPEN_ACL_UNSAFE
     * @param {CreateMode} mode The creation mode, optional, defaults to CreateMode.PERSISTENT
     * @return {Promise}
     */
    mkdirpAsync(path, data = null, acls = null, mode = null) {
        return new Promise((resolve, reject) => {
            this._client.mkdirp(path, data, acls, mode, (e, path) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(path);
                }
            });
        });
    }

    /**
     * Remove a given path in a way similar to rm -rf. Will resolve if the node is deleted
     * or does not exist and reject if anything goes wrong.
     * @param {string} path the Path of the node.
     * @return {Promise}
     */
    rmrfAsync(path) {
        return new Promise((resolve, reject) => {
            this.getChildrenAsync(path).then(children => {
                if (!children || !children.length) {
                    // no children, ready to remove the node.
                    this.removeAsync(path).then(resolve, reject);
                } else {
                    var promises = children.map(c => this.rmrfAsync(`${path}/${c}`));
                    Promise.all(promises).then(() => {
                        // all children removed, now remove this
                        this.removeAsync(path).then(resolve, reject);
                    }, reject);
                }
            }, reject);
        });
    }

    /**
     * Create and return a new Transaction instance which provides a builder object that
     * can be used to construct and commit a set of operations atomically.
     * @returns {AsyncTransaction}
     */
    transaction() {
        const transaction = this._client.transaction();
        const asyncTransaction = new AsyncTransaction(transaction);
        return asyncTransaction;
    }
}


function createAsyncClient(connectionString, options = null) {
    const clientInternal = zookeeper.createClient(connectionString, options);
    return new AsyncClient(clientInternal);
}

module.exports.createAsyncClient = createAsyncClient;
module.exports.AsyncClient = AsyncClient;
module.exports.AsyncTransaction = AsyncTransaction;


