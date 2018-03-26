'use strict';
const Joi = require('joi');
const glob = require('glob');

const internals = {};
internals.relativeTo = process.cwd();

const collectIterator = (iterator, functionCallBack, newList = []) => {

    return Promise.resolve().then(() => {

        const result = iterator.next();

        if (result.done) {

            return Promise.resolve();
        }

        return functionCallBack(result.value);
    }).then((result) => {

        if (result) {

            if (Array.isArray(result)) {

                for (const res of result) {

                    newList.push(res);

                }

            }
            else {

                newList.push(result);

            }

            return collectIterator(iterator, functionCallBack, newList);
        }

        return newList;
    });
};

const executeIterator = (iterator, functionCallBack) => {

    return Promise.resolve().then(() => {

        const result = iterator.next();

        if (result.done) {

            return true;
        }

        return functionCallBack(result.value);
    }).then((result) => {
        if (result) {

            return Promise.resolve();
        }

        return executeIterator(iterator, functionCallBack);
    });
};

const executeAndCollectEach = (list, functionCallBack) => {

    if (list) {

        const iterator = list[Symbol.iterator]();

        return collectIterator(iterator, functionCallBack);
    }

    return Promise.resolve();
};

const executeEach = (list, functionCallBack) => {

    if (list) {

        const iterator = list[Symbol.iterator]();

        return executeIterator(iterator, functionCallBack);
    }

    return Promise.resolve();
};

const runGlob = async (globPattern, ignorePatterns) => {

    return new Promise((resolve, reject) => {
        glob(globPattern, {
            nodir: true,
            strict: true,
            ignore: ignorePatterns,
            cwd: internals.relativeTo
        }, (err, files) => {

            if (!files.length && !err) {
                reject(`Unable to retrieve files from pattern: ${globPattern}`);
            }
            else {
                resolve(files);

            }
        });
    });
};

const buildOptionHelper = (configOptions, injectOptions, methodOpts) => {

    const options = Object.keys(injectOptions).concat(Object.keys(configOptions));

    for (const option of options) {
        if (option !== 'override' && option !== 'merge'
            && !methodOpts.hasOwnProperty(option)) {
            const fromMethod = injectOptions[option];
            const fromConfig = configOptions[option];

            if (!fromMethod || configOptions.override && fromConfig) {
                methodOpts[option] = fromConfig;
            }
            else {
                methodOpts[option] = fromMethod;
            }
        }
    }
};

const buildOptions = (configOptions, injectOptions) => {

    let methodOpts = {};
    let override = false;
    let merge = false;

    if (configOptions) {
        merge = configOptions.merge;
        override = configOptions.override;
    }

    if (injectOptions && !configOptions) {
        methodOpts = injectOptions;
    }
    else if (configOptions && (!injectOptions || override && !merge)) {
        const configKeys = Object.keys(configOptions);

        for (const cKey of configKeys) {
            if (cKey !== 'override' && cKey !== 'merge') {
                methodOpts[cKey] = configOptions[cKey];
            }
        }
    }
    else if (injectOptions && configOptions) {
        if (merge) {
            buildOptionHelper(configOptions, injectOptions, methodOpts);
        }
        else {
            methodOpts = injectOptions;
        }
    }

    return methodOpts;
};

const getItems = async (injectItem) => {

    return executeAndCollectEach(injectItem.includes, (include) => {

        if (Joi.string().validate(include).error) {

            return include;
        }
        return runGlob(include, injectItem.ignores).then((files) => {

            return files;
        });
    });
};

const methodInjectHelper = (server, methods, methodsFilename, methodPrefix, methodOptions, injectModuleValue, injectModuleKey) => {

    const moduleKey = (injectModuleKey) ? '.' + injectModuleKey : '';
    const modPrefix = (methodPrefix) ? methodPrefix + '.' : '';
    const methodName = modPrefix + methodsFilename + moduleKey;
    let methodValue;

    if (!Joi.func().validate(injectModuleValue).error) {
        methodValue = injectModuleValue;
    }
    else if (injectModuleValue.method && !Joi.func().validate(injectModuleValue.method).error) {
        methodValue = injectModuleValue.method;
    }

    if (methodValue) {
        server.method(methodName, methodValue, buildOptions(methodOptions, injectModuleValue.options));

        if (injectModuleKey && methodPrefix) {
            methods[methodPrefix][methodsFilename][injectModuleKey] = server.methods[methodPrefix][methodsFilename][injectModuleKey];
        }
        else if (injectModuleKey && !methodPrefix) {
            methods[methodsFilename][injectModuleKey] = server.methods[methodsFilename][injectModuleKey];
        }
        else if (methodPrefix && !injectModuleKey) {
            methods[methodPrefix][methodsFilename] = server.methods[methodPrefix][methodsFilename];
        }
        else {
            methods[methodsFilename] = server.methods[methodsFilename];
        }
    }
};


// For External Used
internals.getItems = getItems;
internals.methodInjectHelper = methodInjectHelper;
internals.executeAndCollectEach = executeAndCollectEach;
internals.executeEach = executeEach;

module.exports = internals;
