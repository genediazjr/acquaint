'use strict';

let counter = 0;
let someCounter = 0;

exports.square = (x) => {

    return x * x;
};


exports.isEven = (n) => {

    return n % 2 === 0;
};


/**
 * @type {{options: {cache: {expiresIn: number, generateTimeout: number}}, method: function()}}
 * since the option contain cache, it will automatically return promise, not directly the value it self.
 * (that is according to observation of behavior
 */
exports.increment = {
    options: {
        cache: {
            expiresIn: 60000,
            generateTimeout: 60000
        }
    },
    method: () => {

        return ++counter;
    }
};


/**
 * @type {{options: {cache: {expiresIn: number, generateTimeout: number}, bind: {decrement: function()}}, method: exports.decrement.method}}
 * since the option contain cache, it will automatically return promise, not directly the value it self.
 * (that is according to observation of behavior
 */
exports.decrement = {
    options: {
        cache: {
            expiresIn: 60000,
            generateTimeout: 60000
        },
        bind: {
            decrement: () => {

                return --someCounter;
            }
        }
    },
    method: function () {

        return this.decrement();
    }
};


/**
 * @type {{options: {cache: {expiresIn: number, generateTimeout: number}, bind: {divide: function(*, *)}}, method: exports.divide.method}}
 * since the option contain cache, it will automatically return promise, not directly the value it self.
 * (that is according to observation of behavior
 */
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
    method: function (a, b) {

        return this.divide(a, b);
    }
};


/**
 * @type {{options: {cache: {expiresIn: number, generateTimeout: number}}, something: function(*)}}
 * since the option contain cache, it will automatically return promise, not directly the value it self.
 * (that is according to observation of behavior
 */
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
