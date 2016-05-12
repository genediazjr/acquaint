'use strict';

module.exports = [
    {
        path: '/test2',
        method: 'GET',
        handler: (request, reply) => {

            return reply('hello');
        }
    }
];
