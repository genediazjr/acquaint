'use strict';

let current = 1;
let previous = 1;


module.exports = {
    add: (x, y) => {

        return x + y;
    },
    multiply: (x, y) => {

        return x * y;
    },
    fibonacci: {
        options: {
            bind: {
                sum: (x, y) => {

                    return x + y;
                }
            }
        },
        method: function (next) {

            const value = this.sum(current, previous);
            previous = current;
            current = value;

            return next(null, value);
        }
    }
};
