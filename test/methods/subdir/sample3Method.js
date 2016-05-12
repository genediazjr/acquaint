'use strict';

const Plugin = require('../../../');

exports.useAdd = (x, y) => {

    return Plugin.methods.add(x, y);
};
