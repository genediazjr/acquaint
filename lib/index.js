'use strict';

const Joi = require('joi');
const Async = require('async');
const Path = require('path');
const FunctionHelper = require('./functionHelper')

const apps = {};
const binds = {};
const methods = {};
const internals = {};

internals.injectObjectSchema = Joi.object().keys({
    prefix: Joi.string().optional(),
    includes: Joi.array().items(Joi.string(), Joi.object(), Joi.func()).required(),
    ignores: Joi.array().items(Joi.string()).optional(),
    options: Joi.object().keys({
        bind: Joi.object().optional(),
        cache: Joi.object().optional(),
        generateKey: Joi.func().optional(),
        callback: Joi.boolean().optional(),
        override: Joi.boolean().optional(),
        merge: Joi.boolean().optional()
    }).optional()
});

internals.injectArraySchema = Joi.array().items(internals.injectObjectSchema);

internals.optionsSchema = Joi.object().keys({
    relativeTo: Joi.string().optional(),
    routes: internals.injectArraySchema.optional(),
    handlers: internals.injectArraySchema.optional(),
    methods: internals.injectArraySchema.optional(),
    binds: internals.injectArraySchema.optional(),
    apps: internals.injectArraySchema.optional()
});


exports.plugin = {
    pkg: require('../package.json'),
    register: (server, options) => {

        const validateOptions = internals.optionsSchema.validate(options);

        if (validateOptions.error) {

            return Promise.reject(new Error(validateOptions.error.message));
        }

        if (options.relativeTo) {

            FunctionHelper.relativeTo = options.relativeTo;

        }

        const appInject = async () => {

            return FunctionHelper.executeEach(options.apps, (injectItem) => {

                return FunctionHelper.getItems(injectItem).then((items) => {

                    return FunctionHelper.executeEach(items, (item) => {

                        let injectModule;
                        let appName;

                        if (Joi.string().validate(item).error) {
                            injectModule = item;
                        }
                        else {

                            injectModule = require(FunctionHelper.relativeTo + '/' + item);
                            appName = Path.basename(item, Path.extname(item));

                        }
                        if (!Joi.func().validate(injectModule).error) {

                            if (injectModule.name) {
                                appName = item.name;
                            }

                            if (!appName) {

                                return Promise.reject('Unable to identify the app name. Please refer to app loading api.');
                            }

                            server.app[appName] = injectModule;
                            apps[appName] = server.app[appName];

                            return Promise.resolve();
                        }

                        return Async.forEachOf(injectModule, (injectModuleValue, injectModuleKey, nextInjectModuleKey) => {

                            server.app[injectModuleKey] = injectModuleValue;
                            apps[injectModuleKey] = server.app[injectModuleKey];

                            return nextInjectModuleKey();
                        }, (err) => {

                            if (err) {

                                return Promise.reject(err);
                            }

                            return Promise.resolve();
                        });
                    });
                });

            });
        }

        const bindInject = async () => {

            return FunctionHelper.executeEach(options.binds, (injectItem) => {

                return FunctionHelper.getItems(injectItem).then((items) => {

                    return FunctionHelper.executeEach(items, (item) => {

                        let injectModule;
                        let bindName;

                        if (Joi.string().validate(item).error) {
                            injectModule = item;
                        }
                        else {
                            injectModule = require(FunctionHelper.relativeTo + '/' + item);
                            bindName = Path.basename(item, Path.extname(item));
                        }

                        if (!Joi.func().validate(injectModule).error) {

                            if (injectModule.name) {
                                bindName = item.name;
                            }

                            if (!bindName) {

                                return Promise.reject('Unable to identify the bind name. Please refer to bind loading api.');
                            }

                            binds[bindName] = injectModule;

                            return Promise.resolve();
                        }

                        return Async.forEachOf(injectModule, (injectModuleValue, injectModuleKey, nextInjectModuleKey) => {

                            binds[injectModuleKey] = injectModuleValue;

                            return nextInjectModuleKey();
                        }, (err) => {

                            if (err) {

                                return Promise.reject(err);
                            }

                            return Promise.resolve();
                        });
                    });
                });
            }).then(() => {
                if (Object.keys(binds).length) {
                    server.bind(binds);
                }
            });
        }

        const methodInject = async () => {

            return FunctionHelper.executeEach(options.methods, (injectItem) => {

                return FunctionHelper.getItems(injectItem).then((items) => {

                    if (injectItem.prefix) {
                        methods[injectItem.prefix] = {};
                    }

                    return FunctionHelper.executeEach(items, (item) => {

                        let injectModule;
                        let methodsFilename;

                        if (Joi.string().validate(item).error) {
                            injectModule = item;

                            if (item.name || item.method) {
                                methodsFilename = item.name || item.method.name;
                            }
                        }
                        else {
                            injectModule = require(FunctionHelper.relativeTo + '/' + item);
                            methodsFilename = Path.basename(item, Path.extname(item));
                        }

                        if (!methodsFilename) {

                            return Promise.reject('Unable to identify method name. Please refer to method loading API.');
                        }

                        if (injectItem.prefix) {
                            methods[injectItem.prefix][methodsFilename] = {};
                        }
                        else {
                            methods[methodsFilename] = {};
                        }

                        if (!Joi.func().validate(injectModule).error || injectModule.options) {

                            FunctionHelper.methodInjectHelper(server, methods, methodsFilename, injectItem.prefix, injectItem.options, injectModule);

                            return Promise.resolve();
                        }

                        return Async.forEachOf(injectModule, (injectModuleValue, injectModuleKey, nextInjectModuleKey) => {

                            FunctionHelper.methodInjectHelper(server, methods, methodsFilename, injectItem.prefix, injectItem.options, injectModuleValue, injectModuleKey);

                            return nextInjectModuleKey();
                        }, (err) => {

                            if (err) {

                                return Promise.reject(err);
                            }

                            return Promise.resolve();
                        });
                    });
                });
            });
        }

        const handlerInject = async () => {

            return FunctionHelper.executeEach(options.handlers, (injectItem) => {

                return FunctionHelper.getItems(injectItem).then((items) => {

                    return FunctionHelper.executeEach(items, (item) => {

                        if (Joi.string().validate(item).error) {

                            server.decorate('handler', item.name, item);
                        }
                        else {

                            server.decorate('handler', Path.basename(item, Path.extname(item)), require(FunctionHelper.relativeTo + '/' + item));
                        }
                    });

                });
            });

        }

        const routeInject = async () => {

            return FunctionHelper.executeEach(options.routes, (injectItem) => {

                return FunctionHelper.getItems(injectItem).then((items) => {

                    return FunctionHelper.executeEach(items, (item) => {

                        if (Joi.string().validate(item).error) {

                            server.route(item);

                        }
                        else {

                            server.route(require(FunctionHelper.relativeTo + '/' + item));

                        }
                    });
                });
            });

        }

        const injectionList = [appInject(), bindInject (), methodInject(), handlerInject(), routeInject()];

        return Promise.all(injectionList);
    }

}
exports.apps = apps;


exports.binds = binds;


exports.methods = methods;
