'use strict';

module.exports = function (x) {

    let operation = (a) => {

        return a;
    };

    if (this && typeof this.operation === 'function') {
        operation = this.operation;
    }

    return operation(x);
};
