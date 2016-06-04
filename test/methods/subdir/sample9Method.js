'use strict';

const Plugin = require('../../../');


exports.sample8Method = (a) => {

    return Plugin.methods.sample8Method(a);
};


exports.sample6Method = (a, next) => {

    Plugin.methods.sample6Method(a, (err, data) => {

        return next(err, data);
    });
};


exports.increment = (next) => {

    Plugin.methods.sample1Method.increment((err, data) => {

        return next(err, data);
    });
};


exports.decrement = (next) => {

    Plugin.methods.sample1Method.decrement((err, data) => {

        return next(err, data);
    });
};
