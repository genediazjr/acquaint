'use strict';

module.exports = () => {

    return function () {
        // (request, h) is the original function but since h is not in use in current  func, we will remove request h
        return 'hello';
    };
};
