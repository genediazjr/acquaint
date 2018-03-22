'use strict';

let Hapi = require('hapi');
let Plugin = require('../');
const Code = require('code');
const Lab = require('lab');
const Path = require('path');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;

describe('app loading', () => {

    let server;

    beforeEach(() => {
        Hapi = require('hapi');
        Plugin = require('../');
        server = new Hapi.Server({
            routes: {
                files: {
                    relativeTo: `${Path.join(__dirname)}`
                }
            }
        });
    });

    const register = async (options) => {
        // Load Plugins
        return await server.register([
            {
                plugin: Plugin,
                options: options
            }
        ]);
    };

    it('exposes apps through the plugin', () => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(Plugin.apps).to.equal({ foo: 'bar' });

        }).catch((err) => {

            expect(err).to.not.exist();

        });
    });

    it('registers apps with inject object', () => {

        register({
            apps: [{ includes: ['apps/*App.js'] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

        }).catch((err) => {

            expect(err).to.not.exist();

        });
    });

    it('has error on no apps found', () => {

        register({
            apps: [{ includes: ['does/not/*exist.js'] }]
        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('has error on no name found', () => {

        register({
            apps: [{
                includes: [() => {

                    return 'foobar';
                }]
            }]
        }).catch((err) => {

            expect(err).to.exist();
            expect(err).to.match(/Unable to identify the app name. Please refer to app loading api./i);

        });
    });

    it('has usable direct inject apps', () => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(server.app.foo).to.equal('bar');

        });
    });

    it('has apps usable on handlers', () => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            return server.route({
                method: 'get',
                path: '/',
                options: {
                    handler: function (request, h) {

                        return request.server.app.foo;
                    }
                }
            });
        }).then(() => {

            const options = {
                method: 'get',
                url: '/'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res.result).to.equal('bar');

        });
    });

    it('has apps usable on external handlers with depricated server.handler', () => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            server.handler('someHandler', () => {

                return (request, h) => {

                    return request.server.app.foo;
                };
            });

            return server.route({
                method: 'get',
                path: '/',
                options: {
                    handler: {someHandler: {}}
                }
            });
        }).then(() => {

            const options = {
                method: 'get',
                url: '/'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res.result).to.equal('bar');
        }).catch((error) => {

            expect(error).to.exist();
            expect(error.message).to.contains('server.handler is not a function');

        });
    });

    it('has apps usable on external handlers with new server.decorate', () => {

        register({
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            server.decorate('handler', 'someHandler', () => {

                return (request, h) => {

                    return request.server.app.foo;
                };
            });

            return server.route({
                method: 'get',
                path: '/',
                options: {
                    handler: {someHandler: {}}
                }
            });
        }).then(() => {

            const options = {
                method: 'get',
                url: '/'
            };

            return server.inject(options);
        }).then((res) => {
            expect(res.result).to.equal('bar');
        });
    });

    it('uses name of function', () => {

        register({
            apps: [{
                includes: [function foo() {

                    return 'bar';
                }]
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(server.app.foo()).to.equal('bar');

        }).catch((err) => {

            expect(err).to.not.exist();

        });
    });

    it('has usable autoloaded apps', () => {

        register({
            apps: [{ includes: ['apps/*App.js'] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(server.app.foo).to.equal('bar');
            expect(server.app.bar()).to.equal('foo');

        }).catch((err) => {

            expect(err).to.not.exist();
        });
    });
});
