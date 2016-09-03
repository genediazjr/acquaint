## API

### Usage
Plugins used inside routes, handlers, and methods must be registered first before acquaint.
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
        ],
        binds: [
            {
                includes: [
                    'path/to/server/*Binds.js'
                ]
            }
        ],
        apps: [
            {
                includes: [
                    'path/to/server/*Apps.js'
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
You may see this sample usage in a [TodoMVC](https://github.com/genediazjr/hapitodo) app.

### Options
* `relativeTo`
  * String of the current working directory in which to search. Defaults to `process.cwd()`.
* `routes`, `handlers`, `methods`, `binds`, and `apps`
  * Array of [inject objects](#inject-object) to be included.
  * You may specify only routes if you only want to autoload routes. The same for handlers, methods, and binds.
  * Returns an `error` if no files are retrieved on the specified [glob](https://github.com/isaacs/node-glob) pattern.

Caveats of `binds` ([server.bind](http://hapijs.com/api#serverbindcontext)):
  * Will not work if the route was registered outside of the plugin.
  * Will not work if the route has a handler that is autoloaded as well.
  * External `binds` will not be usable on autoloaded handlers.
  * For `bind` keys with duplicates, the last entry will be used.

##### Inject Object
* `includes` - array of glob string pattern/s or the `route`, `handler`, or `method` itself. Required.
* `ignores` - array of glob string pattern/s to be excluded while matching. Optional.
* `prefix` - string prefix for methods. Methods use only. Optional.
* `options` - object configuration as *default options* for loaded methods. Methods use only. Optional.
  * `merge` - boolean to merge the keys that does not exist on the loaded options. Defaults to false. Optional.
  * `override` - boolean to force the use of the *default options*. Defaults to false. Optional.

### Option Examples

##### Route Example

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

##### Handler Example

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

##### Method Example

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
    methods: [
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
    methods: [
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

glob string with default method options
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

default options with `merge` and `override`
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
                    override: true
                },
                bind: {
                    operation: (x, next) => {
                        ...
                        return next(a);
                    }
                },
                merge: true,
                override: true
            }
        }
    ]
}
```

##### Bind Example

glob string
```js
options: {
    binds: [
        {
            includes: [
                'path/to/server/*Binds.js'
            ]
        }
    ]
}
```

or the bind itself (Name is required for sole functions. Don't use arrow functions.)
```js
options: {
    binds: [{ includes: [{ foo: 'bar'}] }]
}
```

##### App Example

glob string
```js
options: {
    apps: [
        {
            includes: [
                'path/to/server/*Apps.js'
            ]
        }
    ]
}
```

or the app object itself.
```js
options: {
    apps: [{ includes: [{ foo: 'bar'}] }]
}
```

See the [tests](test) for other examples.

### File Signatures

##### Route Signature
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

##### Handler Signature
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

##### Method Signature
```js
exports.createOrUpdate = (user, next) => {
    ...
    return next(err, userFromDb);
};

exports.obtainOrDelete = {
    method: (user, next) => {
        ...
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

module.exports.createOrUpdate = (user, next) => {
    const sample = context.methods.prefix.filename.exportedFunction;
    ...
    return next(err, userFromDb);
};
```

You may also inject a method that exports a function
```js
module.exports = (user, next) => {
    ...
    return next(err, userFromDb);
}; 
```

Or a method with `method` and `options` keys
```js
module.exports = {
    method: (user, next) => {
        ...
    },
    options: {
        ...
    }
};
```
