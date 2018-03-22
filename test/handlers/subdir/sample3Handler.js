'use strict';

module.exports = (route, options) => {

    return function (request, h) {

        return request.server.methods.sample1Method.square(options.value);
    };
};
