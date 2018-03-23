'use strict';

module.exports = [
    {
        path: '/test2',
        method: 'GET',
        options: {
            handler: () => {
                // (request, h) is the original function but since h is not in use in current  func, we will remove request and h
                return 'hello';
            }
        }
    }
];
