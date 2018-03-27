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

describe('routes loading', () => {

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

    it('registers routes with inject object', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            routes: [
                {
                    includes: ['routes/**/*1Route.js']
                },
                {
                    includes: ['routes/**/*2Route.js']
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();

            return server.initialize();
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(server.table()).to.have.length(2);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has error on no routes found', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            routes: [{
                includes: ['does/not/*exist.js']
            }]
        }).catch((err) => {

            expect(err).to.exist();
            expect(err).to.equal('Unable to retrieve files from pattern: does/not/*exist.js');
        });
    });

    it('has usable autoloaded routes', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            routes: [{
                includes: ['routes/**/*1Route.js']
            }]
        }).then((res) => {

            expect(res).not.to.exist();

            const options = {
                method: 'get',
                url: '/test1'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res).to.exist();
            expect(res.statusCode).to.be.equal(200);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('has usable autoloaded routes using direct inject', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            routes: [
                {
                    includes: [
                        {
                            path: '/test1',
                            method: 'GET',
                            handler: function () {
                                // (request, h) is the original function but since h is not in use in current  func, we will remove request and  h

                                return 'hello';
                            }
                        }
                    ]
                }
            ]
        }).then((res) => {

            expect(res).not.to.exist();

            const options = {
                method: 'get',
                url: '/test1'
            };

            return server.inject(options);
        }).then((res) => {

            expect(res).to.exist();
            expect(res.statusCode).to.be.equal(200);
        }).catch((err) => {

            expect(err).to.exist();
        });
    });
});
