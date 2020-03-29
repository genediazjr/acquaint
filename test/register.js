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


describe('registration', () => {

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

    it('registers without routes, handlers or methods', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {}).then((resolved) => {

            expect(resolved).to.not.exist();
        });
    });

    it('registers with custom working directory', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            routes: [
                {
                    includes: [
                        'routes/**/*1Route.js',
                        'routes/**/*2Route.js'
                    ]
                }
            ]
        }).then((resolved) => {

            expect(resolved).to.not.exist();
            expect(server.table()).to.have.length(2);
        });
    });

    it('has error on invalid syntax', () => {

        const server = createHapiServerInstance();

        registerHapi(server, {
            relativeTo: __dirname,
            methods: [{
                includes: () => { }
            }]
        }).catch((err) => {

            expect(err).to.exist();
        });
    });

    it('will not load malformed methods using direct inject', () => {
        const server = createHapiServerInstance();

        let counter = 0;

        registerHapi(server, {
            relativeTo: __dirname,
            methods: [
                {
                    prefix: 'sample1Method',
                    includes: [
                        {
                            options: {
                                cache: {
                                    expiresIn: 60000,
                                    generateTimeout: 60000
                                }
                            },
                            something: function thisWillBeNotRegistered(next) {

                                return next(null, ++counter);
                            }
                        }
                    ]
                }
            ]
        }).catch((err) => {

            expect(err).to.exist();
            expect(err).to.match(/Unable to identify method name. Please refer to method loading API./i);
        });
    });
});
