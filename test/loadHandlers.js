'use strict';

let Hapi = require('hapi');
const Code = require('code');
const Lab = require('lab');
let Plugin = require('../');
const Path = require('path');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('handler loading', () => {
    const createHapiServerInstance = () => {
        Hapi = require('hapi');
        Plugin = require('../');
        const hapiServer = new Hapi.Server({
            routes: {
                files: {
                    relativeTo: `${Path.join(__dirname)}`
                }
            }
        });
        return hapiServer;
    };

    const registerHapi = async (hapiServer, options) => {
        // Load Plugins
        return await hapiServer.register([
            {
                plugin: Plugin,
                options: options
            }
        ]);
    };

    it('registers handlers with inject object', () => {
        const server = createHapiServerInstance();

        registerHapi(server, {
            handlers: [
                {
                    includes: [
                        'handlers/**/*1Handler.js'
                    ]
                },
                {
                    includes: [
                        'handlers/**/*2Handler.js'
                    ]
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('has error on no handlers found', () => {
        const server = createHapiServerInstance();

        registerHapi(server, {
            handlers: [
                {
                    includes: [
                        'does/not/*exist.js'
                    ]
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('has usable autoloaded handlers', () => {
        const server = createHapiServerInstance();

        registerHapi(server, {
            handlers: [
                {
                    includes: [
                        'handlers/**/*1Handler.js'
                    ]
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            return server.route({
                method: 'get',
                path: '/test1',
                options: {
                    handler: {sample1Handler: {}}
                }
            });
        }).then((res) => {

            expect(res).to.not.exist();

            const options = {
                method: 'get',
                url: '/test1'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res.statusCode).to.be.equal(200);

        }).catch((err) => {

            expect(err).to.exist();

        });
    });

    it('has usable autoloaded handlers using direct inject', () => {
        const server = createHapiServerInstance();

        registerHapi(server, {
            handlers: [
                {
                    includes: [
                        function sample1Handler() {

                            return function () {
                                // (request, h) is the original function but since h is not in use in current  func, we will remove request and h

                                return 'hello hapi :)';
                            };
                        }
                    ]
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            return server.route({
                method: 'get',
                path: '/test2',
                options: {
                    handler: {sample1Handler: {}}
                }
            });
        }).then((res) => {

            expect(res).to.not.exist();

            const options = {
                method: 'get',
                url: '/test2'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res.statusCode).to.be.equal(200);

        });
    });

    it('has usable handlers on routes', () => {
        const server = createHapiServerInstance();

        registerHapi(server, {
            routes: [
                {
                    includes: [
                        'routes/**/*3Route.js'
                    ]
                }
            ],
            handlers: [
                {
                    includes: [
                        'handlers/**/*1Handler.js'
                    ]
                }
            ]
        }).then((res) => {
            expect(res).to.not.exist();

            const options = {
                method: 'get',
                url: '/test3'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res.statusCode).to.be.equal(200);

        }).catch((err) => {

            expect(err).to.exist();

        });
    });
});
