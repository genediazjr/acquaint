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

describe('bind loading', () => {

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

    it('exposes binds through the plugin', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            binds: [{ includes: [{ test: 'value1' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(Plugin.binds).to.equal({ test: 'value1' });

        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('exposes binds through the plugin', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            binds: [{ includes: [{ test: 'value1' }] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(Plugin.binds).to.equal({ test: 'value1' });

        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('registers binds with inject object', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            binds: [{ includes: ['methods/**/*5Method.js'] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('has error on no binds found', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            binds: [{ includes: ['does/not/*exist.js'] }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('has error on no name found', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            binds: [{
                includes: [() => {

                    return 'foobar';
                }]
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

        }).catch((err) => {

            expect(err).to.exist();
            expect(err).to.match(/Unable to identify the bind name. Please refer to bind loading api./i);

        });
    });

    it('has usable autoloaded binds with included routes', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            binds: [{ includes: [{ test: 'value' }] }],
            routes: [{
                includes: [{
                    method: 'get',
                    path: '/',
                    options: {
                        handler: (request, h) => {

                            return h.realm.settings.bind.test;
                        }
                    }
                }]
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            const options = {
                method: 'get',
                url: '/'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res.result).to.equal('value');

        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('uses name of function', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            binds: [{
                includes: [function functionTest() {

                    return 'bar';
                }]
            }],
            routes: [{
                includes: [{
                    method: 'get',
                    path: '/',
                    options: {
                        handler: (request, h) => {

                            return h.realm.settings.bind.functionTest();
                        }
                    }
                }]
            }]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            const options = {
                method: 'get',
                url: '/'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res.result).to.equal('bar');

        }).catch((err) => {

            expect(err).to.exist();

        });
    });
});

