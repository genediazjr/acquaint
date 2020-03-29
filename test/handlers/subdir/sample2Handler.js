'use strict';

module.exports = (route, options) => {

    return function () {
        // (request, h) is the original function but since h is not in use in current  func, we will remove request and h
        return `new handler ${options.msg}`;
    };
};
