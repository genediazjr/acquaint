# acquaint
Hapi plugin to load routes, handlers, and methods through [globs] (https://github.com/isaacs/node-glob).
All glob [rules] (https://github.com/isaacs/node-glob/blob/master/README.md) apply. 

[![npm version](https://badge.fury.io/js/acquaint.svg)](https://badge.fury.io/js/acquaint)
[![Dependency Status](https://david-dm.org/genediazjr/acquaint.svg)](https://david-dm.org/genediazjr/acquaint)
[![Build Status](https://travis-ci.org/genediazjr/acquaint.svg?branch=master)](https://travis-ci.org/genediazjr/acquaint)
[![Coverage Status](https://coveralls.io/repos/github/genediazjr/acquaint/badge.svg?branch=master)](https://coveralls.io/github/genediazjr/acquaint?branch=master)
[![Code Climate](https://codeclimate.com/github/genediazjr/acquaint/badges/gpa.svg)](https://codeclimate.com/github/genediazjr/acquaint)

## Usage

```js
server.register({
    register: require('acquaint'),
    options: {
        relativeTo: __dirname, 
        routes: [
          'path/to/user/**/*Routes.js',
          'path/to/sample/**/*Routes.js'
        ],
        handlers: [
            {
                includes: 'path/to/**/*Handlers.js',
                ignores: 'TestHandler.js'
            }
        ],
        methods: [
            {
                prefix: 'model',
                includes: [
                    'path/to/user/*Models.js',
                    'path/to/sample/*Models.js'
                ],
            },
            {
                prefix: 'util',
                includes: 'path/to/**/*Utils.js'
            }
        ]
    }
}, (err) => {
    ...
});
```
[Glue] (https://github.com/hapijs/glue) manifest
```js
registrations: [
    {
        plugin: {
            register: 'acquaint',
            options: [
                ... 
            ]
        }
    }
]
```

## Options
* **relativeTo** 
  * `String` of the current working directory in which to search. Defaults to `process.cwd()`.
* **routes**, **handlers**, and **methods** 
  * Can be a `string` glob pattern, an `array` of `string` glob patterns, or an `array` of [inject objects] (#inject-object) to be included.
  * You may specify only routes if you only want to autoload routes. The same for handlers and methods.
  * Returns an `error` if no files are retrieved on the specified [glob] (https://github.com/isaacs/node-glob) pattern.

#### Inject Object
* **includes** `string`/`array` - glob file pattern/s to be injected
* **ignores** `string`/`array` - glob file pattern/s to be ignored
* **prefix** `string` - method usage prefix. only for methods.

## Examples

#### Route
```js
module.exports = [
    {
        path: '/',
        method: 'get',
        handler: (request, reply) => {
            ...
            return reply('hello');
        }
    }
];
```

#### Handler
```js
module.exports = (route, options) => {

    return (request, reply) => {
        ...
        return reply('hello');
    };
};
```

Handler use on route
```js
module.exports = [
    {
        path: '/',
        method: 'get',
        handler: {
            handlerFilename: {
                someOption: 'options parameter on handler'
            }
        }
    }
];
```

#### Method
```js
export.createOrUpdate = (user, next) => {
    ...
    return next(err, userFromDb);
};

export.obtainOrDelete = {
    method: (user, next) => {
        ....
    },
    options: {
        ...
    }
};
```

Method use on server
```js
server.methods.methodPrefix.FileName.exportedFunction(user, (err, data) => {
    ...
});
```

Method use on handler
```js
module.exports = (route, options) => {

    return (request, reply) => {
    
        request.server.methods.methodPrefix.FileName.exportedFunction(user, (err, data) => {
            ...
            return reply('hello');
        });
    };
};
```

Method use on other method
```js
const context = require('acquaint');

module.export.createOrUpdate = (user, next) => {
    const sample = context.methods.prefix.filename.exportedFunction;
    ...
    return next(err, userFromDb);
};
```

You may also inject a method that exports a function
```js
module.export = (user, next) => {
    ...
    return next(err, userFromDb);
}; 
```

Or a method with ***method*** and ***options*** keys
```js
module.export = {
    method: (user, next) => {
        ....
    },
    options: {
        ...
    }
}; 
```

## Contributing
* Include 100% test coverage
* Follow the [Hapi coding conventions] (http://hapijs.com/styleguide)
* Submit an issue first for significat changes.

## Credits 
* [hapi-router] (https://github.com/bsiddiqui/hapi-router) - Auto route loading for Hapi
* [hapi-handlers] (https://github.com/ar4mirez/hapi-handlers) - Autoload handlers for Hapi
* [hapi-methods-injection] (https://github.com/amgohan/hapi-methods-injection) - Scan and register automatically your hapi methods
