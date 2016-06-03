'use strict';

let counter = 0;

module.exports = (next) => {

    return next(null, --counter);
};
