# acquaint
Hapi plugin to load routes, handlers, and methods through [globs] (https://github.com/isaacs/node-glob).

[![Build Status](https://travis-ci.org/genediazjr/acquaint.svg)](https://travis-ci.org/genediazjr/acquaint)
[![Coverage Status](https://coveralls.io/repos/genediazjr/acquaint/badge.svg)](https://coveralls.io/r/genediazjr/acquaint)
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
* **relativeTo** - `string` of the current working directory in which to search. Defaults to `process.cwd()`.
* **routes**, **handlers**, and **methods** - `array` of [inject objects] (#inject-object) or glob `string` pattern/s to be included.
 
#### Inject Object
* **includes** `string`/`array` - glob file pattern/s to be injected
* **ignores** `string`/`array` - glob file pattern/s to be ignored
* **prefix** `string` - method usage prefix. only for methods.

## Examples

#### route
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

#### handler
```js
module.exports = (route, options) => {

    return (request, reply) => {
        ...
        return reply('hello');
    };
};
```

Use on route
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

#### method
```js
module.export.createOrUpdate = (user, next) => {
    ...
    return next(err, userFromDb);
};
```

Use on server
```js
server.methods.methodPrefix.FileName.exportedFunction(user, (err, data) => {
    ...
});
```

Use on handler
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

Use on other method
```js
const context = require('acquaint');

module.export.createOrUpdate = (user, next) => {
    const sample = context.methods.prefix.filename.exportedFunction;
    ...
    return next(err, userFromDb);
};
```

## Contributing
* Include 100% test coverage
* Follow the [Hapi coding conventions] (http://hapijs.com/styleguide)

## Credits 
* [hapi-router] (https://github.com/bsiddiqui/hapi-router) - Auto route loading for Hapi
* [hapi-handlers] (https://github.com/ar4mirez/hapi-handlers) - Autoload handlers for Hapi
* [hapi-methods-injection] (https://github.com/amgohan/hapi-methods-injection) - Scan and register automatically your hapi methods
