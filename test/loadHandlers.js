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

describe('handler loading', () => {

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

                            return function (request, reply) {

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

                            return function (request, reply) {

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
});
