'use strict';

module.exports = {
    options: {
        cache: {
            expiresIn: 60000,
            generateTimeout: 60000
        }
    },
    method: (a, next) => {

        return next(null, a + a);
    }
};
