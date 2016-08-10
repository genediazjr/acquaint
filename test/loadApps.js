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

describe('app loading', () => {

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

    it('exposes apps through the plugin', (done) => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }, (err) => {

            expect(err).to.not.exist();
            expect(Plugin.apps).to.equal({ foo: 'bar' });

            return done();
        });
    });

    it('registers apps with inject object', (done) => {

        register({
            apps: [{ includes: ['test/apps/**/*App.js'] }]
        }, (err) => {

            expect(err).to.not.exist();

            return done();
        });
    });

    it('has error on no apps found', (done) => {

        register({
            apps: [{ includes: ['does/not/*exist.js'] }]
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('has error on no name found', (done) => {

        register({
            apps: [{
                includes: [() => {

                    return 'foobar';
                }]
            }]
        }, (err) => {

            expect(err).to.exist();
            expect(err).to.match(/Unable to identify the app name. Please refer to app loading api./i);

            return done();
        });
    });

    it('has usable autoloaded apps', (done) => {

        register({
            apps: [{ includes: ['test/apps/**/*App.js'] }]
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.app.foo).to.equal('bar');
            expect(server.app.bar()).to.equal('foo');

            return done();
        });
    });

    it('has usable direct inject apps', (done) => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.app.foo).to.equal('bar');

            return done();
        });
    });

    it('has apps usable on handlers', (done) => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }, (err) => {

            expect(err).to.not.exist();

            server.route({
                method: 'get',
                path: '/',
                handler: function (request, reply) {

                    return reply(request.server.app.foo);
                }
            });

            server.inject({
                method: 'get',
                url: '/'
            }, (res) => {

                expect(res.result).to.equal('bar');

                return done();
            });
        });
    });

    it('has apps usable on external handlers', (done) => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }, (err) => {

            expect(err).to.not.exist();

            server.handler('someHandler', () => {

                return (request, reply) => {

                    return reply(request.server.app.foo);
                };
            });

            server.route({
                method: 'get',
                path: '/',
                handler: { someHandler: {} }
            });

            server.inject({
                method: 'get',
                url: '/'
            }, (res) => {

                expect(res.result).to.equal('bar');

                return done();
            });
        });
    });

    it('uses name of function', (done) => {

        register({
            apps: [{
                includes: [function foo() {

                    return 'bar';
                }]
            }]
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.app.foo()).to.equal('bar');

            return done();
        });
    });
});
