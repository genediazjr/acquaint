'use strict';

module.exports = (route, options) => {

    return function (request, h) {

        return `new handler ${options.msg}`;
    };
};
