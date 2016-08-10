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

describe('bind loading', () => {

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

    it('registers binds with inject object', (done) => {

        register({
            binds: [{ includes: ['test/methods/**/*5Method.js'] }]
        }, (err) => {

            expect(err).to.not.exist();

            return done();
        });
    });

    it('has error on no binds found', (done) => {

        register({
            binds: [{ includes: ['does/not/*exist.js'] }]
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('has error on no name found', (done) => {

        register({
            binds: [{
                includes: [() => {

                    return 'foobar';
                }]
            }]
        }, (err) => {

            expect(err).to.exist();
            expect(err).to.match(/Unable to identify the bind name. Please refer to bind loading api./i);

            return done();
        });
    });

    it('has usable autoloaded binds with included routes', (done) => {

        register({
            binds: [{ includes: [{ test: 'value' }] }],
            routes: [{
                includes: [{
                    method: 'get',
                    path: '/',
                    handler: function (request, reply) {

                        return reply(this.test);
                    }
                }]
            }]
        }, (err) => {

            expect(err).to.not.exist();

            server.inject({
                method: 'get',
                url: '/'
            }, (res) => {

                expect(res.result).to.equal('value');

                return done();
            });
        });
    });

    it('uses name of function', (done) => {

        register({
            binds: [{
                includes: [function foo() {

                    return 'bar';
                }]
            }],
            routes: [{
                includes: [{
                    method: 'get',
                    path: '/',
                    handler: function (request, reply) {

                        return reply(this.foo());
                    }
                }]
            }]
        }, (err) => {

            expect(err).to.not.exist();

            server.inject({
                method: 'get',
                url: '/'
            }, (res) => {

                expect(res.result).to.equal('bar');

                return done();
            });
        });
    });
});
