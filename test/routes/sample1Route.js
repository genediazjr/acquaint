'use strict';

module.exports = [
    {
        path: '/test1',
        method: 'GET',
        handler: (request, reply) => {

            return reply('hello');
        }
    }
];
