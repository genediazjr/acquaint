# acquaint
Hapi plugin to load `routes`, `handlers`, and `methods` through [globs](https://github.com/isaacs/node-glob).
All glob [rules](https://github.com/isaacs/node-glob/blob/master/README.md) apply. 

* Supports glob patterns for injecting.
* Supports direct injection through plugin register options.
* Supports default options such as `cache` and `bind` on loaded `methods`.

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
            {
                includes: [
                    'path/to/user/**/*Routes.js'
                ]
            }
        ],
        handlers: [
            {
                includes: [
                    'path/to/**/*Handlers.js'
                ],
                ignores: [
                    'TestHandler.js'
                ]
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
                includes: [
                    'path/to/**/*Utils.js'
                ]
            }
        ]
    }
}, (err) => {
    ...
});
```
[Glue](https://github.com/hapijs/glue) manifest
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
  * `array` of [inject objects](#inject-object) to be included.
  * You may specify only routes if you only want to autoload routes. The same for handlers and methods.
  * Returns an `error` if no files are retrieved on the specified [glob](https://github.com/isaacs/node-glob) pattern.

#### Inject Object
* **includes** - `array` of glob `string` pattern/s or the `route`, `handler`, or `method` itself. Required.
* **ignores** - `array` of glob `string` pattern/s to be excluded while matching. Optional.
* **prefix** - `string` prefix for methods. Methods use only. Optional.
* **options** - `object` configuration as default options for loaded methods. Methods use only. Optional.

## Option Examples

#### Route Example

glob string
```js
options: {
    routes: [
        {
            includes: [
                'path/to/user/**/*Routes.js'
            ]
        }
    ]
}
```

or the route itself
```js
options: {
    routes: [
        {
            includes: [
                {
                    path: '/test1',
                    method: 'get',
                    handler: (request, reply) => {
                        ...
                        return reply('hello');
                    }
                },
                'path/to/other/**/*Routes.js'
            ]
        }
    ]
}
```

#### Handler Example

glob string
```js
options: {
    handlers: [
        {
            includes: [
                'path/to/user/**/*Handlers.js'
            ]
        }
    ]
}
```

or the handler itself (Function name is required. Don't use arrow functions.)
```js
options: {
    handlers: [
        {
            includes: [
                function handlerName (route, options) {

                    return (request, reply) => {
                        ...
                        return reply('hello');
                    };
                },
                'path/to/other/**/*Handlers.js'
            ]
        }
    ]
}
```

#### Method Example

glob string
```js
options: {
    methods: [
        {
            prefix: 'model',
            includes: [
                'path/to/model/**/*Methods.js'
            ]
        }
    ]
}
```

or the method itself (Function name is required. Don't use arrow functions.)
```js
options: {
    routes: [
        {
            prefix: 'model',
            includes: [
                function methodName (x, y) {
                    ...
                    return x + y + z;
                },
                'path/to/other/**/*Methods.js'
            ]
        }
    ]
}
```

method with options (Function name is required. Don't use arrow functions.)
```js
options: {
    routes: [
        {
            prefix: 'model',
            includes: [
                {
                    options: {
                        cache: {
                            expiresIn: 60000,
                            generateTimeout: 60000
                        }
                    },
                    method: function methodName(x, y) {
                        ...
                        return x + y + z;
                    }
                },
                'path/to/other/**/*Methods.js'
            ]
        }
    ]
}
```

glob string with default method options (Overridden by file or direct options.)
```js
options: {
    methods: [
        {
            prefix: 'model',
            includes: [
                'path/to/model/**/*Methods.js'
            ],
            options: {
                cache: {
                    expiresIn: 60000,
                    generateTimeout: 60000
                },
                bind: someObject
            }
        }
    ]
}
```

See the [tests](https://github.com/genediazjr/acquaint/blob/master/test/index.js) for other examples.

## File Signatures

#### Route Signature
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

#### Handler Signature
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

#### Method Signature
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

Method use on other method (Options such as `cache` and `bind` are not available here)
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
* Follow the [Hapi coding conventions](http://hapijs.com/styleguide)
* Submit an issue first for significant changes.

## Credits 
* [hapi-router](https://github.com/bsiddiqui/hapi-router) - Auto route loading for Hapi
* [hapi-handlers](https://github.com/ar4mirez/hapi-handlers) - Autoload handlers for Hapi
* [hapi-methods-injection](https://github.com/amgohan/hapi-methods-injection) - Scan and register automatically your hapi methods
