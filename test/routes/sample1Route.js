'use strict';

module.exports = [
    {
        path: '/test1',
        method: 'GET',
        handler: function (request, reply) {

            return reply('hello');
        }
    }
];
