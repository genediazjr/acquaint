'use strict';

let counter = 0;


exports.square = (x) => {

    return x * x;
};


exports.isEven = (n) => {

    return n % 2 === 0;
};


exports.increment = {
    options: {
        cache: {
            expiresIn: 60000,
            generateTimeout: 60000
        }
    },
    method: (next) => {

        return next(null, ++counter);
    }
};


exports.divide = {
    options: {
        cache: {
            expiresIn: 60000,
            generateTimeout: 60000
        },
        bind: {
            divide: (a, b) => {

                return a / b;
            }
        }
    },
    method: function (a, b, next) {

        return next(null, this.divide(a, b));
    }
};


exports.thisWillBeNotRegistered = {
    options: {
        cache: {
            expiresIn: 60000,
            generateTimeout: 60000
        }
    },
    something: (next) => {

        return next(null, ++counter);
    }
};
