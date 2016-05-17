'use strict';

const Path = require('path');
const Glob = require('glob');
const Async = require('async');
const methods = {};
const internals = {};

internals.isArray = Array.isArray;

internals.isString = (variable) => {

    return typeof variable === 'string' || variable instanceof String;
};

internals.isFunction = (variable) => {

    return typeof variable === 'function';
};

internals.castArray = (variable) => {

    return internals.isArray(variable) ? variable : internals.isString(variable) ? [variable] : [];
};


exports.register = (server, options, next) => {

    const relativeTo = options.relativeTo || process.cwd();

    const runGlob = (globPattern, ignorePatterns, callback) => {

        return Glob(globPattern, {
            nodir: true,
            strict: true,
            ignore: ignorePatterns,
            cwd: relativeTo
        }, (err, files) => {

            if (!files.length && !err) {
                err = 'No files found for pattern: ' + globPattern;
            }

            return callback(err, files);
        });
    };

    const getFiles = (injectItem, callback) => {

        if (internals.isString(injectItem)) {

            return runGlob(injectItem, null, (err, files) => {

                return callback(err, files);
            });
        }

        if (internals.isString(injectItem.includes)) {

            return runGlob(injectItem.includes, injectItem.ignores, (err, files) => {

                return callback(err, files);
            });
        }

        if (internals.isArray(injectItem.includes)) {
            let filesArr = [];

            return Async.each(injectItem.includes, (include, nextInclude) => {

                return runGlob(include, injectItem.ignores, (err, files) => {

                    filesArr = filesArr.concat(files);

                    return nextInclude(err, files);
                });

            }, (err) => {

                return callback(err, filesArr);
            });
        }

        return callback('invalid syntax for inject objects');
    };

    const methodInjectHelper = (methodsFilename, methodPrefix, injectModuleValue, injectModuleKey) => {

        let isValid = false;
        const moduleKey = (injectModuleKey) ? '.' + injectModuleKey : '';
        const modPrefix = (methodPrefix) ? methodPrefix + '.' : '';
        const methodName = modPrefix + methodsFilename + moduleKey;

        if (internals.isFunction(injectModuleValue)) {
            server.method(methodName, injectModuleValue);
            isValid = true;
        }

        if (injectModuleValue.options && injectModuleValue.method && internals.isFunction(injectModuleValue.method)) {
            server.method(methodName, injectModuleValue.method, injectModuleValue.options);
            isValid = true;
        }

        if (isValid) {
            if (injectModuleKey) {
                if (methodPrefix) {
                    methods[methodPrefix][methodsFilename][injectModuleKey] = injectModuleValue;
                }
                else {
                    methods[methodsFilename][injectModuleKey] = injectModuleValue;
                }
            }
            else {
                if (methodPrefix) {
                    methods[methodPrefix][methodsFilename] = injectModuleValue;
                }
                else {
                    methods[methodsFilename] = injectModuleValue;
                }
            }
        }

        return;
    };

    const methodInject = (nextInject) => {

        return Async.each(internals.castArray(options.methods), (injectItem, nextInjectItem) => {

            getFiles(injectItem, (err, files) => {

                if (err) {
                    return nextInjectItem(err);
                }

                if (injectItem.prefix) {
                    methods[injectItem.prefix] = {};
                }

                return Async.each(files, (file, nextFile) => {

                    const injectModule = require(relativeTo + '/' + file);
                    const methodsFilename = Path.basename(file, Path.extname(file));

                    if (injectItem.prefix) {
                        methods[injectItem.prefix][methodsFilename] = {};
                    }
                    else {
                        methods[methodsFilename] = {};
                    }

                    if (internals.isFunction(injectModule) || injectModule.options) {

                        methodInjectHelper(methodsFilename, injectItem.prefix, injectModule);

                        return nextFile(err);
                    }

                    return Async.forEachOf(injectModule, (injectModuleValue, injectModuleKey, nextInjectModuleKey) => {

                        methodInjectHelper(methodsFilename, injectItem.prefix, injectModuleValue, injectModuleKey);

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

        return Async.each(internals.castArray(options.handlers), (injectItem, nextInjectItem) => {

            getFiles(injectItem, (err, files) => {

                if (err) {
                    return nextInjectItem(err);
                }

                return Async.each(files, (file, nextFile) => {

                    server.handler(Path.basename(file, Path.extname(file)), require(relativeTo + '/' + file));

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

        return Async.each(internals.castArray(options.routes), (injectItem, nextInjectItem) => {

            getFiles(injectItem, (err, files) => {

                if (err) {
                    return nextInjectItem(err);
                }

                return Async.each(files, (file, nextFile) => {

                    server.route(require(relativeTo + '/' + file));

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
