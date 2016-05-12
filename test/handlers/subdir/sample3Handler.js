'use strict';

module.exports = (route, options) => {

    return (request, reply) => {

        return reply(request.server.methods.sample1Method.square(options.value));
    };
};
