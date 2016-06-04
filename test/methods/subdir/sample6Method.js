'use strict';

let counter = 1;


module.exports = {
    options: {
        cache: {
            expiresIn: 60000,
            generateTimeout: 60000
        }
    },
    method: (a, next) => {

        return next(null, {
            addToSelf: a + a,
            counter: ++counter
        });
    }
};
