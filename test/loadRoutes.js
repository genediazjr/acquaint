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

describe('route loading', () => {

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
                            handler: function (request, reply) {

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
});
