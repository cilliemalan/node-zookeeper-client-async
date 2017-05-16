const assert = require('chai').assert;
require('./utilities/throwsAsync');

describe('Testing system', function () {
    describe('internals', function () {
        it('should function', function () {
            assert.equal(2, 1 + 1);
        });
    });
});
