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

describe('app loading', () => {

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

    it('exposes apps through the plugin', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(Plugin.apps).to.equal({ foo: 'bar' });
        }).catch((err) => {

            expect(err).to.not.exist();
        });
    });

    it('has error on no apps found on existing folder', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: ['apps/*NotExistApp.js'] }]
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('registers apps with inject object', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: ['apps/*App.js'] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('registers apps with inject object', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: ['apps/*Test.js'] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has error on no apps found', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: ['does/not/*exist.js'] }]
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has error on no name found', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{
                includes: [() => {

                    return 'foobar';
                }]
            }]
        }).catch((err) => {

            expect(err).to.exist();
            expect(err).to.equal('Unable to identify the app name. Please refer to app loading api.');
        });
    });
    it('has error on no name found, has apps usable on external handlers with new server.decorate', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: [
                function () {

                    return 'bar';
                },
                function add(x, y) {

                    return x + y;
                },
                function multiply(x, y) {

                    return x * y;
                }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            server.decorate('handler', 'someHandler', () => {

                return (request) => {
                    // (request, h) is the original function but since h is not in use in current  func, we will remove h

                    return request.server.app.foo();
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
        }).catch((err) => {

            expect(err).to.equal('Unable to identify the app name. Please refer to app loading api.');
        });
    });

    it('has usable direct inject apps', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(server.app.foo).to.equal('bar');
        });
    });

    it('has apps usable on handlers', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            return server.route({
                method: 'get',
                path: '/',
                options: {
                    handler: function (request) {
                        // (request, h) is the original function but since h is not in use in current  func, we will remove h
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

    it('has apps usable on external handlers with deprecated server.handler', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            server.handler('someHandler', () => {

                return (request) => {
                    // (request, h) is the original function but since h is not in use in current  func, we will remove h
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

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: [{ foo: 'bar' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            server.decorate('handler', 'someHandler', () => {

                return (request) => {
                    // (request, h) is the original function but since h is not in use in current  func, we will remove h
                    return request.server.app.foo;
                };
            });

            return server.route({
                method: 'get',
                path: '/',
                options: {
                    handler: { someHandler: {} }
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

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
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

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            apps: [{ includes: ['apps/*App.js'] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(server.app.foo).to.equal('bar');
            expect(server.app.bar()).to.equal('foo');

        }).catch((err) => {

            expect(err).to.exist();

        });
    });
});
