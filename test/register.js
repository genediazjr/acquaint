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

describe('registration', () => {

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

    it('registers without routes, handlers or methods', (done) => {

        register({}, (err) => {

            expect(err).to.not.exist();

            return done();
        });
    });

    it('registers with custom working directory', (done) => {

        register({
            relativeTo: __dirname,
            routes: [
                {
                    includes: [
                        'routes/**/*1Route.js',
                        'routes/**/*2Route.js'
                    ]
                }
            ]
        }, (err) => {

            expect(err).to.not.exist();

            expect(server.connections[0].table()).to.have.length(2);

            return done();
        });
    });

    it('has error on invalid syntax', (done) => {

        register({
            methods: [
                {
                    includes: () => {
                    }
                }
            ]
        }, (err) => {

            expect(err).to.exist();

            return done();
        });
    });

    it('will not load malformed methods using direct inject', (done) => {

        let counter = 0;

        register({
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
        }, (err) => {

            expect(err).to.exist();
            expect(err).to.match(/Unable to identify method name. Please refer to method loading API./i);

            return done();
        });
    });
});
