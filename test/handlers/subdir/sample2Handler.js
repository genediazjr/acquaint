'use strict';

module.exports = (route, options) => {

    return (request, reply) => {

        return reply('new handler: ' + options.msg);
    };
};
