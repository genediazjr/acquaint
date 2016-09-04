'use strict';

module.exports = [
    {
        path: '/test2',
        method: 'GET',
        handler: function (request, reply) {

            return reply('hello');
        }
    }
];
