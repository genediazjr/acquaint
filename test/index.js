'use strict';

const Async = require('async');
const Hapi = require('hapi');
const Code = require('code');
const Lab = require('lab');
const Plugin = require('../');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;

describe('registration and functionality', () => {

    let server;

    beforeEach((done) => {

        server = new Hapi.Server();
        server.connection();

        return done();
    });

    const register = (options, next) => {

        server.register({
            register: Plugin,
            options: options
        }, (err) => {

            return next(err);
        });
    };

    it('registers without routes, handlers or methods', (done) => {

        register({}, (err) => {

            expect(err).to.not.exist();

            return done();
        });
    });

    it('registers with custom working directory', (done) => {

        register({
            relativeTo: __dirname,
            routes: [
                {
                    includes: [
                        'routes/**/*1Route.js',
                        'routes/**/*2Route.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.connections[0].table()).to.have.length(2);

            return done();
        });
    });

    it('registers routes with inject object', (done) => {

        register({
            routes: [
                {
                    includes: [
                        'test/routes/**/*1Route.js'
                    ]
                },
                {
                    includes: [
                        'test/routes/**/*2Route.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.connections[0].table()).to.have.length(2);

            return done();
        });
    });

    it('registers handlers with inject object', (done) => {

        register({
            handlers: [
                {
                    includes: [
                        'test/handlers/**/*1Handler.js'
                    ]
                },
                {
                    includes: [
                        'test/handlers/**/*2Handler.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            return done();
        });
    });

    it('registers methods with inject object', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'test/methods/**/*1Method.js'
                    ]
                },
                {
                    includes: [
                        'test/methods/**/*2Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            return done();
        });
    });

    it('has error on no routes found', (done) => {

        register({
            routes: [
                {
                    includes: [
                        'does/not/*exist.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('has error on no handlers found', (done) => {

        register({
            handlers: [
                {
                    includes: [
                        'does/not/*exist.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('has error on no methods found', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'does/not/*exist.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('has error on invalid syntax', (done) => {

        register({
            methods: [
                {
                    includes: () => {
                    }
                }
            ]
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('has usable autoloaded routes', (done) => {

        register({
            routes: [
                {
                    includes: [
                        'test/routes/**/*1Route.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.inject({
                method: 'get',
                url: '/test1'
            }, (res) => {

                expect(res.statusCode).to.be.equal(200);

                return done();
            });
        });
    });

    it('has usable autoloaded routes using direct inject', (done) => {

        register({
            routes: [
                {
                    includes: [
                        {
                            path: '/test1',
                            method: 'GET',
                            handler: (request, reply) => {

                                return reply('hello');
                            }
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.inject({
                method: 'get',
                url: '/test1'
            }, (res) => {

                expect(res.statusCode).to.be.equal(200);

                return done();
            });
        });
    });

    it('has usable autoloaded handlers', (done) => {

        register({
            handlers: [
                {
                    includes: [
                        'test/handlers/**/*1Handler.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.route({
                method: 'get',
                path: '/test1',
                handler: {
                    sample1Handler: {}
                }
            });

            server.inject({
                method: 'get',
                url: '/test1'
            }, (res) => {

                expect(res.statusCode).to.be.equal(200);

                return done();
            });
        });
    });

    it('has usable autoloaded handlers using direct inject', (done) => {

        register({
            handlers: [
                {
                    includes: [
                        function sample1Handler() {

                            return (request, reply) => {

                                return reply('hello');
                            };
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.route({
                method: 'get',
                path: '/test1',
                handler: {
                    sample1Handler: {}
                }
            });

            server.inject({
                method: 'get',
                url: '/test1'
            }, (res) => {

                expect(res.statusCode).to.be.equal(200);

                return done();
            });
        });
    });

    it('has usable autoloaded methods', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'test/methods/**/*1Method.js'
                    ]
                }
            ]
        }, (err) => {

            server.initialize();

            expect(err).to.not.exist();

            expect(server.methods.sample1Method.square(5), 'square').to.equal(25);
            expect(server.methods.sample1Method.isEven(4), 'isEven').to.equal(true);
            expect(server.methods.sample1Method.isEven(3), 'isEven').to.equal(false);

            server.methods.sample1Method.divide(4, 2, (err, data) => {

                expect(err).to.not.exist();
                expect(data, 'divide').to.equal(2);
            });

            server.methods.sample1Method.increment((err, data) => {

                expect(err).to.not.exist();
                expect(data, 'increment').to.equal(1);
            });

            server.methods.sample1Method.decrement((err, data) => {

                expect(err).to.not.exist();
                expect(data, 'decrement').to.equal(-1);
            });

            setTimeout(() => {

                Async.series([
                    (doneTest) => {

                        server.methods.sample1Method.increment((err, data) => {

                            expect(err).to.not.exist();
                            expect(data, 'increment').to.equal(1);

                            return doneTest();
                        });
                    },
                    (doneTest) => {

                        server.methods.sample1Method.decrement((err, data) => {

                            expect(err).to.not.exist();
                            expect(data, 'decrement').to.equal(-1);

                            return doneTest();
                        });
                    }
                ], () => {
                    return done();
                });
            }, 1000);
        });
    });

    it('has usable autoloaded methods using direct inject', (done) => {

        let counter = 0;

        register({
            methods: [
                {
                    prefix: 'sample1Method',
                    includes: [
                        function square(x) {

                            return x * x;
                        },
                        function isEven(n) {

                            return n % 2 === 0;
                        },
                        {
                            options: {
                                cache: {
                                    expiresIn: 60000,
                                    generateTimeout: 60000
                                }
                            },
                            method: function increment(next) {

                                return next(null, ++counter);
                            }
                        },
                        {
                            options: {
                                cache: {
                                    expiresIn: 60000,
                                    generateTimeout: 60000
                                },
                                bind: {
                                    divide: (a, b) => {

                                        return a / b;
                                    }
                                }
                            },
                            method: function divide(a, b, next) {

                                return next(null, this.divide(a, b));
                            }
                        }
                    ]
                }
            ]
        }, (err) => {

            server.initialize();

            expect(err).to.not.exist();

            expect(server.methods.sample1Method.square(5), 'square').to.equal(25);
            expect(server.methods.sample1Method.isEven(4), 'isEven').to.equal(true);
            expect(server.methods.sample1Method.isEven(3), 'isEven').to.equal(false);

            server.methods.sample1Method.divide(4, 2, (err, data) => {

                expect(err).to.not.exist();
                expect(data, 'divide').to.equal(2);
            });

            server.methods.sample1Method.increment((err, data) => {

                expect(err).to.not.exist();
                expect(data, 'increment').to.equal(1);
            });

            setTimeout(() => {

                server.methods.sample1Method.increment((err, data) => {

                    expect(err).to.not.exist();
                    expect(data, 'increment').to.equal(1);

                    return done();
                });
            }, 1000);
        });
    });

    it('has usable handlers on routes', (done) => {

        register({
            routes: [
                {
                    includes: [
                        'test/routes/**/*3Route.js'
                    ]
                }
            ],
            handlers: [
                {
                    includes: [
                        'test/handlers/**/*1Handler.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.inject({
                method: 'get',
                url: '/test3'
            }, (res) => {

                expect(res.statusCode).to.be.equal(200);

                return done();
            });
        });
    });

    it('has usable handlers on routes using direct inject', (done) => {

        register({
            routes: [
                {
                    includes: [
                        'test/routes/**/*3Route.js'
                    ]
                }
            ],
            handlers: [
                {
                    includes: [
                        function sample1Handler() {

                            return (request, reply) => {

                                return reply('hello');
                            };
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.inject({
                method: 'get',
                url: '/test3'
            }, (res) => {

                expect(res.statusCode).to.be.equal(200);

                return done();
            });
        });
    });

    it('has usable methods on handlers', (done) => {

        register({
            handlers: [
                {
                    includes: [
                        'test/handlers/**/*3Handler.js'
                    ]
                }
            ],
            methods: [
                {
                    includes: [
                        'test/methods/**/*1Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            const testValue = 5;

            server.route({
                method: 'get',
                path: '/test4',
                handler: {
                    sample3Handler: {
                        value: testValue
                    }
                }
            });

            server.inject({
                method: 'get',
                url: '/test4'
            }, (res) => {

                expect(res.statusCode).to.be.equal(200);
                expect(parseInt(res.payload)).to.be.equal(server.methods.sample1Method.square(testValue));
                expect(parseInt(res.result)).to.be.equal(server.methods.sample1Method.square(testValue));

                return done();
            });
        });
    });

    it('has usable methods on handlers using direct inject', (done) => {

        let counter = 0;

        register({
            handlers: [
                {
                    includes: [
                        'test/handlers/**/*3Handler.js'
                    ]
                }
            ],
            methods: [
                {
                    prefix: 'sample1Method',
                    includes: [
                        function square(x) {

                            return x * x;
                        },
                        function isEven(n) {

                            return n % 2 === 0;
                        },
                        {
                            options: {
                                cache: {
                                    expiresIn: 60000,
                                    generateTimeout: 60000
                                }
                            },
                            method: function increment(next) {

                                return next(null, ++counter);
                            }
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            const testValue = 5;

            server.route({
                method: 'get',
                path: '/test4',
                handler: {
                    sample3Handler: {
                        value: testValue
                    }
                }
            });

            server.inject({
                method: 'get',
                url: '/test4'
            }, (res) => {

                expect(res.statusCode).to.be.equal(200);
                expect(parseInt(res.payload)).to.be.equal(server.methods.sample1Method.square(testValue));
                expect(parseInt(res.result)).to.be.equal(server.methods.sample1Method.square(testValue));

                return done();
            });
        });
    });

    it('has usable methods on other methods', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'test/methods/subdir/*Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            const testValueX = 5;
            const testValueY = 3;

            expect(server.methods.sample2Method.add(testValueX, testValueY)).to.be.equal(server.methods.sample3Method.useAdd(testValueX, testValueY));

            return done();
        });
    });

    it('has usable methods on other methods using direct inject', (done) => {

        register({
            methods: [
                {
                    prefix: 'sample2Method',
                    includes: [
                        function add(x, y) {

                            return x + y;
                        },
                        function multiply(x, y) {

                            return x * y;
                        }
                    ]
                },
                {
                    includes: [
                        'test/methods/subdir/*3Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            const testValueX = 5;
            const testValueY = 3;

            expect(server.methods.sample2Method.add(testValueX, testValueY)).to.be.equal(server.methods.sample3Method.useAdd(testValueX, testValueY));

            return done();
        });
    });

    it('has usable methods with prefix', (done) => {

        register({
            methods: [
                {
                    prefix: 'main',
                    includes: [
                        'test/methods/*Method.js'
                    ]
                },
                {
                    prefix: 'sub',
                    includes: [
                        'test/methods/subdir/*Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.methods.main.sample1Method.square(5), 'square').to.equal(25);
            expect(server.methods.main.sample1Method.isEven(4), 'isEven').to.equal(true);
            expect(server.methods.main.sample1Method.isEven(3), 'isEven').to.equal(false);
            expect(server.methods.sub.sample2Method.add(7, 8), 'add').to.equal(15);
            expect(server.methods.sub.sample2Method.multiply(2, 3), 'multiply').to.equal(6);
            expect(server.methods.sub.sample3Method.useAdd(1, 2), 'useAdd').to.equal(3);

            return done();
        });
    });

    it('has usable methods on other methods with prefix', (done) => {

        register({
            methods: [
                {
                    prefix: 'main',
                    includes: [
                        'test/methods/subdir/*2Method.js'
                    ]
                },
                {
                    prefix: 'sub',
                    includes: [
                        'test/methods/subdir/*4Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            const testValueX = 5;
            const testValueY = 3;

            expect(server.methods.main.sample2Method.add(testValueX, testValueY)).to.be.equal(server.methods.sub.sample4Method.useAdd(testValueX, testValueY));

            return done();
        });
    });

    it('has usable function exporting methods', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'test/methods/subdir/*5Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.methods.sample5Method(5, 3), 'subtract').to.equal(2);

            return done();
        });
    });

    it('has usable method and options exporting methods', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'test/methods/subdir/*6Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.methods.sample6Method(9, (err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal({
                    addToSelf: 18,
                    counter: 2
                });
            });

            setTimeout(() => {

                server.methods.sample6Method(11, (err, data) => {

                    expect(err).to.not.exist();
                    expect(data).to.equal({
                        addToSelf: 22,
                        counter: 3
                    });

                    return done();
                });
            }, 1000);
        });
    });

    it('has usable method and options exporting methods using direct inject', (done) => {

        let counter = 1;

        register({
            methods: [
                {
                    includes: [
                        {
                            options: {
                                cache: {
                                    expiresIn: 60000,
                                    generateTimeout: 60000
                                }
                            },
                            method: function sample6Method(a, next) {

                                return next(null, {
                                    addToSelf: a + a,
                                    counter: ++counter
                                });
                            }
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.methods.sample6Method(9, (err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal({
                    addToSelf: 18,
                    counter: 2
                });
            });

            setTimeout(() => {

                server.methods.sample6Method(11, (err, data) => {

                    expect(err).to.not.exist();
                    expect(data).to.equal({
                        addToSelf: 22,
                        counter: 3
                    });

                    return done();
                });
            }, 1000);
        });
    });

    it('has usable function exporting methods with prefix', (done) => {

        register({
            methods: [
                {
                    prefix: 'major',
                    includes: [
                        'test/methods/subdir/*5Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.methods.major.sample5Method(5, 3), 'subtract').to.equal(2);

            return done();
        });
    });

    it('has usable function exporting methods with prefix using direct inject', (done) => {

        register({
            methods: [
                {
                    prefix: 'major',
                    includes: [
                        function sample5Method(a, b) {

                            return a - b;
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.methods.major.sample5Method(5, 3), 'subtract').to.equal(2);

            return done();
        });
    });

    it('has usable method and options exporting methods with prefix', (done) => {

        register({
            methods: [
                {
                    prefix: 'minor',
                    includes: [
                        'test/methods/subdir/*6Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.methods.minor.sample6Method(8, (err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal({
                    addToSelf: 16,
                    counter: 4
                });

                return done();
            });
        });
    });

    it('has usable method and options exporting methods with prefix using direct inject', (done) => {

        register({
            methods: [
                {
                    prefix: 'minor',
                    includes: [
                        {
                            options: {
                                cache: {
                                    expiresIn: 60000,
                                    generateTimeout: 60000
                                }
                            },
                            method: function sample6MethodX(a, next) {

                                return next(null, a + a);
                            }
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            server.methods.minor.sample6MethodX(8, (err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal(16);

                return done();
            });
        });
    });

    it('uses default method options with cache on loaded methods', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'test/methods/subdir/*7Method.js'
                    ],
                    options: {
                        cache: {
                            expiresIn: 60000,
                            generateTimeout: 100
                        }
                    }
                }
            ]
        }, (err) => {

            server.initialize();

            expect(err).to.not.exist();

            server.methods.sample7Method((err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal(-1);
            });

            setTimeout(() => {

                server.methods.sample7Method((err, data) => {

                    expect(err).to.not.exist();
                    expect(data).to.equal(-1);

                    return done();
                });
            }, 1000);
        });
    });

    it('uses default method options with cache on directly injected methods', (done) => {

        let cachedCounter = 0;
        let nonCachedCounter = 0;

        register({
            methods: [
                {
                    prefix: 'cached',
                    includes: [
                        function sample7Method(next) {

                            return next(null, --cachedCounter);
                        }
                    ],
                    options: {
                        cache: {
                            expiresIn: 60000,
                            generateTimeout: 100
                        }
                    }
                },
                {
                    prefix: 'noncached',
                    includes: [
                        function sample7Method(next) {

                            return next(null, --nonCachedCounter);
                        }
                    ]
                }
            ]
        }, (err) => {

            server.initialize();

            expect(err).to.not.exist();

            server.methods.cached.sample7Method((err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal(-1);
            });

            server.methods.noncached.sample7Method((err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal(-1);
            });

            setTimeout(() => {

                server.methods.cached.sample7Method((cachedEecreErr, cachedData) => {

                    expect(cachedEecreErr).to.not.exist();
                    expect(cachedData).to.equal(-1);

                    server.methods.noncached.sample7Method((nonCachedEecreErr, nonCachedData) => {

                        expect(nonCachedEecreErr).to.not.exist();
                        expect(nonCachedData).to.equal(-2);

                        return done();
                    });
                });
            }, 1000);
        });
    });

    it('uses default method options with bind on loaded methods', (done) => {

        register({
            methods: [
                {
                    prefix: 'nobind',
                    includes: [
                        'test/methods/subdir/*8Method.js'
                    ]
                },
                {
                    prefix: 'withbind',
                    includes: [
                        'test/methods/subdir/*8Method.js'
                    ],
                    options: {
                        bind: {
                            operation: function (a) {

                                return a + 'test';
                            }
                        }
                    }
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.methods.nobind.sample8Method(5)).to.equal(5);
            expect(server.methods.withbind.sample8Method(5)).to.equal('5test');

            return done();
        });
    });

    it('uses default method options with bind on directly injected methods', (done) => {

        register({
            methods: [
                {
                    prefix: 'nobind',
                    includes: [
                        function sample8Method(x) {

                            let operation = (a) => {

                                return a;
                            };

                            if (this && typeof this.operation === 'function') {
                                operation = this.operation;
                            }

                            return operation(x);
                        }
                    ]
                },
                {
                    prefix: 'withbind',
                    includes: [
                        function sample8Method(x) {

                            let operation = (a) => {

                                return a;
                            };

                            if (this && typeof this.operation === 'function') {
                                operation = this.operation;
                            }

                            return operation(x);
                        }
                    ],
                    options: {
                        bind: {
                            operation: function (a) {

                                return a + 'test';
                            }
                        }
                    }
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.methods.nobind.sample8Method(5)).to.equal(5);
            expect(server.methods.withbind.sample8Method(5)).to.equal('5test');

            return done();
        });
    });

    it('is able to use method with options within other methods', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'test/methods/subdir/sample8Method.js'
                    ],
                    options: {
                        bind: {
                            operation: function (a) {

                                return a + 'somevalue';
                            }
                        }
                    }
                },
                {
                    includes: [
                        'test/methods/sample1Method.js',
                        'test/methods/subdir/sample6Method.js',
                        'test/methods/subdir/sample9Method.js'
                    ]
                }
            ]
        }, (err) => {

            server.initialize();

            expect(err).to.not.exist();

            expect(server.methods.sample9Method.sample8Method('thats')).to.equal('thatssomevalue');

            server.methods.sample9Method.sample6Method(1, (err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal({
                    addToSelf: 2,
                    counter: 5
                });
            });

            server.methods.sample9Method.increment((err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal(2);
            });

            server.methods.sample9Method.decrement((err, data) => {

                expect(err).to.not.exist();
                expect(data).to.equal(-2);
            });

            setTimeout(() => {

                Async.series([
                    (doneTest) => {

                        server.methods.sample9Method.sample6Method(1, (err, data) => {

                            expect(err).to.not.exist();
                            expect(err).to.not.exist();
                            expect(data).to.equal({
                                addToSelf: 2,
                                counter: 5
                            });

                            return doneTest();
                        });
                    },
                    (doneTest) => {

                        server.methods.sample9Method.increment((err, data) => {

                            expect(err).to.not.exist();
                            expect(data).to.equal(2);

                            return doneTest();
                        });
                    },
                    (doneTest) => {

                        server.methods.sample9Method.decrement((err, data) => {

                            expect(err).to.not.exist();
                            expect(data).to.equal(-2);

                            return doneTest();
                        });
                    }
                ], () => {

                    return done();
                });
            }, 1000);
        });
    });

    it('will not load malformed methods', (done) => {

        register({
            methods: [
                {
                    includes: [
                        'test/methods/**/*1Method.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.methods.sample1Method.square).to.exist();
            expect(server.methods.sample1Method.thisWillBeNotRegistered).to.not.exist();

            return done();
        });
    });

    it('will not load malformed methods using direct inject', (done) => {

        let counter = 0;

        register({
            methods: [
                {
                    prefix: 'sample1Method',
                    includes: [
                        {
                            options: {
                                cache: {
                                    expiresIn: 60000,
                                    generateTimeout: 60000
                                }
                            },
                            something: function thisWillBeNotRegistered(next) {

                                return next(null, ++counter);
                            }
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.exist();
            expect(err).to.match(/Unable to identify method name. Please refer to method options API./i);

            return done();
        });
    });

    it('will not load anonymous function methods using direct inject', (done) => {

        let counter = 0;

        register({
            methods: [
                {
                    prefix: 'sample1Method',
                    includes: [
                        {
                            options: {
                                cache: {
                                    expiresIn: 60000,
                                    generateTimeout: 60000
                                }
                            },
                            method: function (next) {

                                return next(null, ++counter);
                            }
                        }
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.exist();
            expect(err).to.match(/Unable to identify method name. Please refer to method options API./i);

            return done();
        });
    });
});
