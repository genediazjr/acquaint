'use strict';

let Hapi = require('hapi');
let Plugin = require('../');
const Code = require('code');
const Lab = require('lab');
const Path = require('path');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('method loading', () => {

    const createHapiServerInstance = () => {
        Hapi = require('hapi');
        Plugin = require('../');
        return new Hapi.Server({
            routes: {
                files: {
                    relativeTo: `${Path.join(__dirname)}`
                }
            }
        });
    };

    const registerHapi = async (hapiServer, options) => {

        return await hapiServer.register([
            {
                plugin: Plugin,
                options: options
            }
        ]);
    };

    it('registers methods with inject object', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    includes: ['methods/**/*1Method.js']
                },
                {
                    includes: ['methods/**/*2Method.js']
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has error on no methods found', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    includes: ['does/not/*exist.js']
                }
            ]
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('will not load malformed methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [{
                includes: ['methods/**/*1Method.js']
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(hapiServer.methods.sample1Method.square).to.exist();
            expect(hapiServer.methods.sample1Method.thisWillBeNotRegistered).to.not.exist();

        }).catch((err) => {

            expect(err).to.exist();
        });
    });


    it('has usable autoloaded methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [{
                includes: ['methods/**/*1Method.js']
            }]
        }).then(() => {

            return hapiServer.initialize();
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(hapiServer.methods.sample1Method.square(5), 'square').to.equal(25);
            expect(hapiServer.methods.sample1Method.isEven(4), 'isEven').to.equal(true);
            expect(hapiServer.methods.sample1Method.isEven(3), 'isEven').to.equal(false);

            hapiServer.methods.sample1Method.divide(4, 2).then((res) => {

                expect(res, 'divide').to.equal(2);
            });

            hapiServer.methods.sample1Method.increment().then((res) => {

                expect(res, 'increment').to.equal(1);
            });

            hapiServer.methods.sample1Method.decrement().then((res) => {

                expect(res, 'decrement').to.equal(-1);
            });

            setTimeout(() => {

                hapiServer.methods.sample1Method.increment().then((res) => {

                    expect(res, 'increment').to.equal(1);
                }).then(() => {

                    return hapiServer.methods.sample1Method.decrement();
                }).then((res) => {

                    expect(res, 'decrement').to.equal(-1);
                });
            }, 1000);

        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable autoloaded methods using direct inject', () => {

        const hapiServer = createHapiServerInstance();
        let counter = 0;

        registerHapi(hapiServer, {
            relativeTo: __dirname,
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
                            method: function increment() {

                                return ++counter;
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
                            method: function divide(a, b) {

                                return this.divide(a, b);
                            }
                        }
                    ]
                }
            ]
        }).then(() => {

            return hapiServer.initialize();
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(hapiServer.methods.sample1Method.square(5), 'square').to.equal(25);
            expect(hapiServer.methods.sample1Method.isEven(4), 'isEven').to.equal(true);
            expect(hapiServer.methods.sample1Method.isEven(3), 'isEven').to.equal(false);

            hapiServer.methods.sample1Method.divide(4, 2).then((res) => {

                expect(res, 'divide').to.equal(2);
            });

            hapiServer.methods.sample1Method.increment().then((res) => {

                expect(res, 'increment').to.equal(1);
            });

            setTimeout(() => {

                hapiServer.methods.sample1Method.increment().then((res) => {

                    expect(res, 'decrement').to.equal(1);
                });
            }, 1000);

        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable methods on handlers', () => {
        const hapiServer = createHapiServerInstance();
        const testValue = 5;

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            handlers: [{
                includes: ['handlers/**/*3Handler.js']
            }],
            methods: [{
                includes: ['methods/**/*1Method.js']
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            return hapiServer.route({
                method: 'get',
                path: '/test4',
                options: {
                    handler: {
                        sample3Handler: {
                            value: testValue
                        }
                    }

                }
            });
        }).then((res) => {

            expect(res).to.not.exist();

            const options = {
                method: 'get',
                url: '/test4'
            };

            return hapiServer.inject(options);
        }).then((res) => {

            expect(res.statusCode).to.be.equal(200);
            expect(parseInt(res.payload)).to.be.equal(hapiServer.methods.sample1Method.square(testValue));
            expect(parseInt(res.result)).to.be.equal(hapiServer.methods.sample1Method.square(testValue));
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable methods on other methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [{
                includes: ['methods/subdir/*Method.js']
            }]
        }).then((resolved) => {

            const testValueX = 5;
            const testValueY = 3;

            expect(resolved).to.not.exist();

            expect(hapiServer.methods.sample2Method.add(testValueX, testValueY))
                .to.be.equal(hapiServer.methods.sample3Method.useAdd(testValueX, testValueY));
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable methods on other methods using direct inject', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
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
                    includes: ['methods/subdir/*3Method.js']
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            const testValueX = 5;
            const testValueY = 3;

            expect(hapiServer.methods.sample2Method.add(testValueX, testValueY))
                .to.be.equal(hapiServer.methods.sample3Method.useAdd(testValueX, testValueY));
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable methods with prefix', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    prefix: 'main',
                    includes: ['methods/*Method.js']
                },
                {
                    prefix: 'sub',
                    includes: ['methods/subdir/*Method.js']
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(hapiServer.methods.main.sample1Method.square(5), 'square').to.equal(25);
            expect(hapiServer.methods.main.sample1Method.isEven(4), 'isEven').to.equal(true);
            expect(hapiServer.methods.main.sample1Method.isEven(3), 'isEven').to.equal(false);
            expect(hapiServer.methods.sub.sample2Method.add(7, 8), 'add').to.equal(15);
            expect(hapiServer.methods.sub.sample2Method.multiply(2, 3), 'multiply').to.equal(6);
            expect(hapiServer.methods.sub.sample3Method.useAdd(1, 2), 'useAdd').to.equal(3);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable methods on other methods with prefix', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    prefix: 'main',
                    includes: ['methods/subdir/*2Method.js']
                },
                {
                    prefix: 'sub',
                    includes: ['methods/subdir/*4Method.js']
                }
            ]
        }).then((resolved) => {

            const testValueX = 5;
            const testValueY = 3;
            expect(resolved).to.not.exist();

            expect(hapiServer.methods.main.sample2Method.add(testValueX, testValueY)).to.be.equal(hapiServer.methods.sub.sample4Method.useAdd(testValueX, testValueY));
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable function exporting methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [{
                includes: ['methods/subdir/*5Method.js']
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(hapiServer.methods.sample5Method(5, 3), 'subtract').to.equal(2);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable method and options exporting methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [{
                includes: ['methods/subdir/*6Method.js']
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            hapiServer.methods.sample6Method(9).then((res) => {
                expect(res).to.equal({
                    addToSelf: 18,
                    counter: 2
                });
            });
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable method and options exporting methods using direct inject', () => {

        const hapiServer = createHapiServerInstance();
        let counter = 1;

        registerHapi(hapiServer, {
            relativeTo: __dirname,
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
                            method: function sample6Method(a) {

                                return { addToSelf: a + a, counter: ++counter};
                            }
                        }
                    ]
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            hapiServer.methods.sample6Method(9).then((res) => {
                expect(res).to.equal({
                    addToSelf: 18,
                    counter: 2
                });
            });

            setTimeout(() => {

                hapiServer.methods.sample6Method(11).then((res) => {
                    expect(res).to.equal({
                        addToSelf: 22,
                        counter: 3
                    });
                });

            }, 1);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable function exporting methods with prefix', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [{
                prefix: 'major',
                includes: ['methods/subdir/*5Method.js']
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(hapiServer.methods.major.sample5Method(5, 3), 'subtract').to.equal(2);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable function exporting methods with prefix using direct inject', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
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
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(hapiServer.methods.major.sample5Method(5, 3), 'subtract').to.equal(2);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable method and options exporting methods with prefix', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [{
                prefix: 'minor',
                includes: ['methods/subdir/*6Method.js']
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            hapiServer.methods.minor.sample6Method(8).then((res) => {

                expect(res).to.equal({
                    addToSelf: 16,
                    counter: 3
                });
            });
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable method and options exporting methods with prefix using direct inject', () => {
        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
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
                            method: function sample6MethodX(a) {

                                return a + a;
                            }
                        }
                    ]
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            hapiServer.methods.minor.sample6MethodX(8).then((res) => {

                expect(res).to.equal(16);
            });
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('uses default method options with cache on loaded methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    includes: ['methods/subdir/*7Method.js'],
                    options: {
                        cache: {
                            expiresIn: 60000,
                            generateTimeout: 100
                        }
                    }
                }
            ]
        }).then(() => {

            return hapiServer.initialize();
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            hapiServer.methods.sample7Method().then((res) => {

                expect(res).to.equal(-1);
            });

            setTimeout(() => {

                hapiServer.methods.sample7Method().then((res) => {

                    expect(res).to.equal(-1);
                });
            }, 1000);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('uses default method options with cache on directly injected methods', () => {

        const hapiServer = createHapiServerInstance();
        let cachedCounter = 0;
        let nonCachedCounter = 0;

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    prefix: 'cached',
                    includes: [
                        function sample7Method() {

                            return --cachedCounter;
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
                        function sample7Method() {

                            return --nonCachedCounter;
                        }
                    ]
                }
            ]
        }).then(() => {

            return hapiServer.initialize();
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            hapiServer.methods.cached.sample7Method().then((res) => {

                expect(res).to.equal(-1);
            });

            expect(hapiServer.methods.noncached.sample7Method()).to.equal(-1);

            setTimeout(() => {

                hapiServer.methods.cached.sample7Method().then((res) => {

                    expect(res).to.equal(-1);
                }).then(() => {

                    return hapiServer.methods.noncached.sample7Method();
                }).then((res) => {

                    expect(res).to.equal(-2);
                });

            }, 1000);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('uses default method options with bind on loaded methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    prefix: 'nobind',
                    includes: ['methods/subdir/*8Method.js']
                },
                {
                    prefix: 'withbind',
                    includes: ['methods/subdir/*8Method.js'],
                    options: {
                        bind: {
                            operation: function (a) {

                                return a + 'test';
                            }
                        }
                    }
                }
            ]
        }).then((res) => {

            expect(res).to.not.exist();
            expect(hapiServer.methods.nobind.sample8Method(5)).to.equal(5);
            expect(hapiServer.methods.withbind.sample8Method(5)).to.equal('5test');
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('uses default method options with bind on directly injected methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    prefix: 'nobind',
                    includes: [
                        (x) => {

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
        }).then((res) => {

            expect(res).to.not.exist();
            expect(hapiServer.methods.nobind.sample8Method(5)).to.equal(5);
            expect(hapiServer.methods.withbind.sample8Method(5)).to.equal('5test');

        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('is able to use method with options within other methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    includes: ['methods/subdir/sample8Method.js'],
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
                        'methods/sample1Method.js',
                        'methods/subdir/sample6Method.js',
                        'methods/subdir/sample9Method.js'
                    ]
                }
            ]
        }).then(() => {

            return hapiServer.initialize();
        }).then((res) => {

            expect(res).to.not.exist();
            expect(hapiServer.methods.sample9Method.sample8Method('thats')).to.equal('thatssomevalue');

            hapiServer.methods.sample9Method.sample6Method(1).then((res) => {

                expect(res).to.equal({
                    addToSelf: 2,
                    counter: 5
                });
            });

            hapiServer.methods.sample9Method.increment().then((res) => {

                expect(res).to.equal(2);
            });

            hapiServer.methods.sample9Method.decrement().then((res) => {

                expect(res).to.equal(-2);
            });


            hapiServer.methods.sample9Method.sample6Method(1).then((res) => {

                expect(res).to.equal({
                    addToSelf: 2,
                    counter: 5
                });
            }).then(() => {

                return hapiServer.methods.sample9Method.increment();
            }).then((res) => {

                expect(res).to.equal(2);
            }).then(() => {

                return hapiServer.methods.sample9Method.decrement();
            }).then((res) => {

                expect(res).to.equal(-2);
            });

        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('uses the method options if both config and method option exist', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    includes: ['methods/subdir/sample6Method.js'],
                    options: {
                        cache: {
                            expiresIn: 100,
                            generateTimeout: 100
                        }
                    }
                }
            ]
        }).then(() => {

            return hapiServer.initialize();
        }).then((res) => {

            expect(res).to.not.exist();

            hapiServer.methods.sample6Method(3).then((res) => {

                expect(res).to.equal({
                    addToSelf: 6,
                    counter: 4
                });
            });

            setTimeout(() => {

                hapiServer.methods.sample6Method(3).then((res) => {

                    expect(res).to.equal({
                        addToSelf: 6,
                        counter: 4
                    });
                });
            }, 1000);

        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('overrides loaded options from methods', () => {

        const hapiServer = createHapiServerInstance();
        let counter = 0;

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    includes: ['methods/sample1Method.js'],
                    options: {
                        bind: {
                            decrement: () => {

                                return ++counter;
                            },
                            divide: (a, b) => {

                                return a * b;
                            }
                        },
                        override: true
                    }
                }
            ]
        }).then(() => {

            return hapiServer.initialize();
        }).then((res) => {

            expect(res).to.not.exist();
            expect(hapiServer.methods.sample1Method.decrement()).to.equal(1);
            expect(hapiServer.methods.sample1Method.divide(4, 2)).to.equal(8);

            setTimeout(() => {

                expect(hapiServer.methods.sample1Method.decrement()).to.equal(2);
            }, 1000);

        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('merges loaded options from methods', () => {
        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    includes: ['methods/subdir/sample2Method.js'],
                    options: {
                        cache: {
                            expiresIn: 60000,
                            generateTimeout: 100
                        },
                        merge: true
                    }
                }
            ]
        }).then(() => {

            return hapiServer.initialize();
        }).then((res) => {

            expect(res).to.not.exist();
            hapiServer.methods.sample2Method.fibonacci().then((firstValue) => {

                expect(firstValue).to.equal(2);
            }).then(() => {

                return hapiServer.methods.sample2Method.fibonacci();
            }).then((secondValue) => {

                expect(secondValue).to.equal(2);
            }).then(() => {

                return hapiServer.methods.sample2Method.fibonacci();
            }).then((thirdValue) => {

                expect(thirdValue).to.equal(2);
            });

        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('overrides and merges loaded options from methods', () => {

        const hapiServer = createHapiServerInstance();

        registerHapi(hapiServer, {
            relativeTo: __dirname,
            methods: [
                {
                    includes: ['methods/subdir/sample2Method.js'],
                    options: {
                        cache: {
                            expiresIn: 60000,
                            generateTimeout: 100
                        },
                        bind: {
                            sum: (a, b) => {

                                return a + b * 2;
                            }
                        },
                        merge: true,
                        override: true
                    }
                },
                {
                    includes: ['methods/sample1Method.js'],
                    options: {
                        cache: {
                            expiresIn: 100,
                            generateTimeout: 100
                        },
                        merge: true,
                        override: true
                    }
                }
            ]
        }).then(() => {

            return hapiServer.initialize();
        }).then((res) => {

            expect(res).to.not.exist();

            hapiServer.methods.sample1Method.decrement().then((res) => {

                expect(res).to.equal(-3);
            });

            hapiServer.methods.sample2Method.fibonacci().then((firstValue) => {

                expect(firstValue).to.equal(4);
            }).then(() => {

                return hapiServer.methods.sample2Method.fibonacci();
            }).then((secondValue) => {

                expect(secondValue).to.equal(4);
            }).then(() => {

                return hapiServer.methods.sample2Method.fibonacci();
            }).then((thirdValue) => {

                expect(thirdValue).to.equal(4);
            });

        }).catch((err) => {

            expect(err).to.exist();
        });
    });

});
