'use strict';

let counter = 1;

/**
 *
 * @type {{options: {cache: {expiresIn: number, generateTimeout: number}}, method: function(*)}}
 * since the option contain cache, it will automatically return promise, not directly the value it self.
 * (that is according to observation of behavior
 */

module.exports = {
    options: {
        cache: {
            expiresIn: 60000,
            generateTimeout: 60000
        }
    },
    method: (a) => {

        return { addToSelf: a + a, counter: ++counter };
    }
};
