'use strict';

module.exports = (route, options) => {

    return function (request) {
        // (request, h) is the original function but since h is not in use in current  func, we will remove h
        return request.server.methods.sample1Method.square(options.value);
    };
};
