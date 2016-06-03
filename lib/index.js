'use strict';

const Joi = require('joi');
const Path = require('path');
const Glob = require('glob');
const Async = require('async');
const methods = {};
const internals = {};

internals.injectObjectSchema = Joi.object().keys({
    options: Joi.object().optional(),
    prefix: Joi.string().optional(),
    includes: Joi.array().items(Joi.string(), Joi.object(), Joi.func()).required(),
    ignores: Joi.array().items(Joi.string()).optional()
});

internals.injectArraySchema = Joi.array().items(internals.injectObjectSchema);

internals.optionsSchema = Joi.object().keys({
    relativeTo: Joi.string().optional(),
    routes: internals.injectArraySchema.optional(),
    handlers: internals.injectArraySchema.optional(),
    methods: internals.injectArraySchema.optional()
});

exports.register = (server, options, next) => {

    const validateOptions = internals.optionsSchema.validate(options);
    if (validateOptions.error) {
        return next(validateOptions.error);
    }

    const relativeTo = options.relativeTo || process.cwd();

    const runGlob = (globPattern, ignorePatterns, doneRun) => {

        return Glob(globPattern, {
            nodir: true,
            strict: true,
            ignore: ignorePatterns,
            cwd: relativeTo
        }, (err, files) => {

            let error;

            if (!files.length && !err) {
                error = 'No files found for pattern: ' + globPattern;
            }

            return doneRun(error, files);
        });
    };

    const getItems = (injectItem, doneGet) => {

        let itemsArr = [];

        return Async.each(injectItem.includes, (include, nextInclude) => {

            if (Joi.string().validate(include).error) {

                itemsArr.push(include);

                return nextInclude();
            }

            return runGlob(include, injectItem.ignores, (err, files) => {

                itemsArr = itemsArr.concat(files);

                return nextInclude(err);
            });

        }, (err) => {

            return doneGet(err, itemsArr);
        });
    };

    const methodInjectHelper = (methodsFilename, methodPrefix, methodOptions, injectModuleValue, injectModuleKey) => {

        const moduleKey = (injectModuleKey) ? '.' + injectModuleKey : '';
        const modPrefix = (methodPrefix) ? methodPrefix + '.' : '';
        const methodName = modPrefix + methodsFilename + moduleKey;
        const methodOpts = injectModuleValue.options || methodOptions;
        let methodValue;

        if (!Joi.func().validate(injectModuleValue).error) {
            methodValue = injectModuleValue;
        }
        else if (injectModuleValue.method && !Joi.func().validate(injectModuleValue.method).error) {
            methodValue = injectModuleValue.method;
        }

        if (methodValue) {
            server.method(methodName, methodValue, methodOpts);

            if (injectModuleKey && methodPrefix) {
                methods[methodPrefix][methodsFilename][injectModuleKey] = methodValue;
            }
            else if (injectModuleKey && !methodPrefix) {
                methods[methodsFilename][injectModuleKey] = methodValue;
            }
            else if (methodPrefix && !injectModuleKey) {
                methods[methodPrefix][methodsFilename] = methodValue;
            }
            else {
                methods[methodsFilename] = methodValue;
            }
        }
    };

    const methodInject = (nextInject) => {

        return Async.each(options.methods, (injectItem, nextInjectItem) => {

            getItems(injectItem, (err, items) => {

                if (err) {
                    return nextInjectItem(err);
                }

                if (injectItem.prefix) {
                    methods[injectItem.prefix] = {};
                }

                return Async.each(items, (item, nextFile) => {

                    let injectModule;
                    let methodsFilename;

                    if (Joi.string().validate(item).error) {
                        injectModule = item;

                        if (item.name || item.method) {
                            methodsFilename = item.name || item.method.name;
                        }
                    }
                    else {
                        injectModule = require(relativeTo + '/' + item);
                        methodsFilename = Path.basename(item, Path.extname(item));
                    }

                    if (!methodsFilename) {

                        return nextFile('Unable to identify method name. Please refer to method options API.');
                    }

                    if (injectItem.prefix) {
                        methods[injectItem.prefix][methodsFilename] = {};
                    }
                    else {
                        methods[methodsFilename] = {};
                    }

                    if (!Joi.func().validate(injectModule).error || injectModule.options) {

                        methodInjectHelper(methodsFilename, injectItem.prefix, injectItem.options, injectModule);

                        return nextFile(err);
                    }

                    return Async.forEachOf(injectModule, (injectModuleValue, injectModuleKey, nextInjectModuleKey) => {

                        methodInjectHelper(methodsFilename, injectItem.prefix, injectItem.options, injectModuleValue, injectModuleKey);

                        return nextInjectModuleKey();
                    }, (err) => {

                        return nextFile(err);
                    });

                }, (err) => {

                    return nextInjectItem(err);
                });
            });
        }, (err) => {

            return nextInject(err);
        });
    };

    const handlerInject = (nextInject) => {

        return Async.each(options.handlers, (injectItem, nextInjectItem) => {

            getItems(injectItem, (err, items) => {

                if (err) {
                    return nextInjectItem(err);
                }

                return Async.each(items, (item, nextFile) => {

                    if (Joi.string().validate(item).error) {
                        server.handler(item.name, item);
                    }
                    else {
                        server.handler(Path.basename(item, Path.extname(item)), require(relativeTo + '/' + item));
                    }

                    return nextFile();
                }, (err) => {

                    return nextInjectItem(err);
                });
            });
        }, (err) => {

            return nextInject(err);
        });
    };

    const routeInject = (nextInject) => {

        return Async.each(options.routes, (injectItem, nextInjectItem) => {

            getItems(injectItem, (err, items) => {

                if (err) {
                    return nextInjectItem(err);
                }

                return Async.each(items, (item, nextFile) => {

                    if (Joi.string().validate(item).error) {
                        server.route(item);
                    }
                    else {
                        server.route(require(relativeTo + '/' + item));
                    }

                    return nextFile();
                }, (err) => {

                    return nextInjectItem(err);
                });
            });
        }, (err) => {

            return nextInject(err);
        });
    };

    return Async.series([
        (done) => {

            return methodInject((err) => {

                return done(err);
            });
        },
        (done) => {

            return handlerInject((err) => {

                return done(err);
            });
        },
        (done) => {

            return routeInject((err) => {

                return done(err);
            });
        }
    ], (err) => {

        return next(err);
    });
};


exports.methods = methods;


exports.register.attributes = {
    pkg: require('../package.json')
};
