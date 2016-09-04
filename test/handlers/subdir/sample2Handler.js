'use strict';

module.exports = (route, options) => {

    return function (request, reply) {

        return reply('new handler: ' + options.msg);
    };
};
