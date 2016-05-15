/* jshint -W079 */
'use strict';

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
                'routes/**/*1Route.js',
                'routes/**/*2Route.js'
            ]
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.connections[0].table()).to.have.length(2);

            return done();
        });
    });

    it('registers routes with strings', (done) => {

        register({
            routes: [
                'test/routes/**/*1Route.js',
                'test/routes/**/*2Route.js'
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
                    includes: 'test/routes/**/*1Route.js'
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

    it('registers handlers with strings', (done) => {

        register({
            handlers: [
                'test/handlers/**/*1Handler.js',
                'test/handlers/**/*2Handler.js'
            ]
        }, (err) => {

            expect(err).to.not.exist();

            return done();
        });
    });

    it('registers handlers with inject object', (done) => {

        register({
            handlers: [
                {
                    includes: 'test/handlers/**/*1Handler.js'
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

    it('registers methods with strings', (done) => {

        register({
            methods: [
                'test/methods/**/*1Method.js',
                'test/methods/**/*2Method.js'
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
                    includes: 'test/methods/**/*1Method.js'
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
            routes: 'does/not/*exist.js'
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('has error on no handlers found', (done) => {

        register({
            handlers: 'does/not/*exist.js'
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('has error on no methods found', (done) => {

        register({
            methods: 'does/not/*exist.js'
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
            routes: 'test/routes/**/*1Route.js'
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
            handlers: 'test/handlers/**/*1Handler.js'
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
            methods: 'test/methods/**/*1Method.js'
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.methods.sample1Method.square(5), 'square').to.equal(25);
            expect(server.methods.sample1Method.isEven(4), 'isEven').to.equal(true);
            expect(server.methods.sample1Method.isEven(3), 'isEven').to.equal(false);

            server.methods.sample1Method.increment((incErr, data) => {

                expect(incErr).to.not.exist();
                expect(data, 'increment').to.equal(1);

                return done();
            });
        });
    });

    it('has usable handlers on routes', (done) => {

        register({
            routes: 'test/routes/**/*3Route.js',
            handlers: 'test/handlers/**/*1Handler.js'
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
            handlers: 'test/handlers/**/*3Handler.js',
            methods: 'test/methods/**/*1Method.js'
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
                'test/methods/subdir/*Method.js'
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
                    includes: 'test/methods/*Method.js'
                },
                {
                    prefix: 'sub',
                    includes: 'test/methods/subdir/*Method.js'
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
                    includes: 'test/methods/subdir/*2Method.js'
                },
                {
                    prefix: 'sub',
                    includes: 'test/methods/subdir/*4Method.js'
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

    it('will not load malformed methods', (done) => {

        register({
            methods: 'test/methods/**/*1Method.js'
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.methods.sample1Method.square).to.exist();
            expect(server.methods.sample1Method.thisWillBeNotRegistered).to.not.exist();

            return done();
        });
    });
});
