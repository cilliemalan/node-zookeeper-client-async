const assert = require('chai').assert;

Object.getPrototypeOf(assert).throwsAsync = function (fun, msg) {
    return new Promise((resolve, reject) => {
        var threw = true;

        const onResolve = () => {
            if (msg instanceof RegExp) {
                reject(`Expected an error with a message matching ${msg.toSting()} but got no error.`);
            } else if (msg && typeof msg == 'string') {
                reject(`Expected an error with a message "${msg}" but got no error.`);
            } else if (msg) {
                reject('msg was invalid');
            } else {
                reject('expected an error but got none');
            }
        };

        const onReject = (message) => {
            if (msg instanceof RegExp) {
                if (msg.test(message)) {
                    resolve();
                } else {
                    reject(`Expected error message to match ${msg.toSting()} but was ${message}`);
                }
            } else if (msg && typeof msg == 'string') {
                if (msg == message) {
                    resolve();
                } else {
                    reject(`Expected error message to be "${msg}" but was ${message}`);
                }
            } else if (msg) {
                reject('msg was invalid');
            } else {
                resolve();
            }
        }

        if (fun instanceof Promise) {
            fun.then(onResolve, onReject);
        } else if (typeof fun == 'function') {
            try {
                var result = fun();

                if (result instanceof Promise) {
                    result.then(onResolve, onReject);
                } else {
                    reject(`Expected the function to return a promise but returned ${result.toString()}`);
                }
            }
            catch (e) {
                reject(`expected the function to reject but it threw an exception: ${e}`);
            }
        }
    });
};
