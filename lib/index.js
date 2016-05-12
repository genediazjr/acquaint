'use strict';

const Path = require('path');
const Glob = require('glob');
const Async = require('async');

const methods = {};

const isArray = Array.isArray;

const isString = (variable) => {

    return typeof variable === 'string' || variable instanceof String;
};

const castArray = (variable) => {

    return isArray(variable) ? variable : isString(variable) ? [variable] : [];
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

        if (isString(injectItem)) {

            return runGlob(injectItem, null, (err, files) => {

                return callback(err, files);
            });
        }

        if (isString(injectItem.includes)) {

            return runGlob(injectItem.includes, injectItem.ignores, (err, files) => {

                return callback(err, files);
            });
        }

        if (isArray(injectItem.includes)) {
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

    const methodInject = (nextInject) => {

        return Async.each(castArray(options.methods), (injectItem, nextInjectItem) => {

            getFiles(injectItem, (err, files) => {

                if (err) {
                    return nextInjectItem(err);
                }

                const methodsPrefix = (injectItem.prefix) ? injectItem.prefix + '.' : '';

                return Async.each(files, (file, nextFile) => {

                    const injectModule = require(relativeTo + '/' + file);

                    return Async.forEachOf(injectModule, (injectModuleValue, injectModuleKey, nextInjectModuleKey) => {

                        const methodName = methodsPrefix + Path.basename(file, Path.extname(file)) + '.' + injectModuleKey;

                        if (typeof (injectModuleValue) === 'function') {
                            server.method(methodName, injectModuleValue);
                            methods[injectModuleKey] = injectModuleValue;
                        }

                        if (injectModuleValue.options && injectModuleValue.method && typeof (injectModuleValue.method) === 'function') {
                            server.method(methodName, injectModuleValue.method, injectModuleValue.options);
                            methods[injectModuleKey] = injectModuleValue;
                        }

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

        return Async.each(castArray(options.handlers), (injectItem, nextInjectItem) => {

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

        return Async.each(castArray(options.routes), (injectItem, nextInjectItem) => {

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
