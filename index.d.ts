import * as zookeeper from 'node-zookeeper-client';
import * as bluebird from 'bluebird';

export * from 'node-zookeeper-client';

export class AsyncTransaction {
    constructor(transaction: zookeeper.Transaction);
    create(path: string, dataOrAclsOrMode1?: Buffer | zookeeper.ACL[] | number, dataOrAclsOrMode2?: Buffer | zookeeper.ACL[] | number, dataOrAclsOrMode3?: Buffer | zookeeper.ACL[] | number): AsyncTransaction;
    setData(path: string, data: Buffer | null, version?: number): AsyncTransaction;
    check(path: string, version?: number): AsyncTransaction;
    remove(path: string, version?: number): AsyncTransaction;
    commit(cb: (error: Error | zookeeper.Exception, results: any) => void): void;
    commitAsync(): bluebird<any> | Promise<any>;
}

export class AsyncClient {
    constructor(client: zookeeper.Client);
    connectAsync(): bluebird<void> | Promise<void>;
    closeAsync(): bluebird<boolean> | Promise<boolean>;
    createAsync(path: string, dataOrAclsOrMode1?: Buffer | zookeeper.ACL[] | number, dataOrAclsOrMode2?: Buffer | zookeeper.ACL[] | number, dataOrAclsOrMode3?: Buffer | zookeeper.ACL[] | number): bluebird<string | boolean> | Promise<string | boolean>;
    removeAsync(path: string, version?: number): bluebird<boolean> | Promise<boolean>;
    existsAsync(path: string): bluebird<zookeeper.Stat | null> | Promise<zookeeper.Stat | null>;
    getChildrenAsync(path: string): bluebird<string[] | null> | Promise<string[] | null>;
    getDataAsync(path: string): bluebird<AsyncDataResult | null> | Promise<AsyncDataResult | null>;
    setDataAsync(path: string, data: Buffer | null, version?: number): bluebird<zookeeper.Stat> | Promise<zookeeper.Stat>;
    getACLAsync(path: string): bluebird<AsyncACLResult | null> | Promise<AsyncACLResult | null>;
    setACLAsync(pathL: string, acls: zookeeper.ACL[], version?: number): bluebird<zookeeper.Stat> | Promise<zookeeper.Stat>;
    mkdirpAsync(path: string, dataOrAclsOrMode1?: Buffer | zookeeper.ACL[] | number, dataOrAclsOrMode2?: Buffer | zookeeper.ACL[] | number, dataOrAclsOrMode3?: Buffer | zookeeper.ACL[] | number): bluebird<string> | Promise<string>;
    rmrfAsync(path: string): bluebird<boolean> | Promise<boolean>;
    transaction(): AsyncTransaction;
}

export interface AsyncDataResult {
    data: Buffer;
    stat: zookeeper.Stat;
}

export interface AsyncACLResult {
    acls: zookeeper.ACL[];
    stat: zookeeper.Stat;
}

export function createAsyncClient(connectionString: string, options?: Partial<zookeeper.Option>): AsyncClient;
