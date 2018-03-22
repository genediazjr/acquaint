'use strict';

const Plugin = require('../../../');


exports.sample8Method = (a) => {

    return Plugin.methods.sample8Method(a);
};


exports.sample6Method = (a) => {

    return Plugin.methods.sample6Method(a);
};


exports.increment = () => {

    return Plugin.methods.sample1Method.increment();
};


exports.decrement = () => {

    return Plugin.methods.sample1Method.decrement();
};
