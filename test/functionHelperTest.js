'use strict';

const FunctionHelper = require('../lib/functionHelper');
const Code = require('code');
const Lab = require('lab');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('Function Helper helps', () => {

    const userData = [
        {
            name: 'Andrew',
            lastName: 'Bunac'
        },
        {
            name: 'John',
            lastName: 'Doe'
        }
    ];

    it('execute and collect each function Helper', () => {
        return FunctionHelper.executeAndCollectEach(userData, (item) => {
            return item.name;
        }).then((resolve) => {
            expect(resolve.length).to.equal(2);
        });
    });

    it('execute and collect each function Helper, onde of the item will return list', () => {
        return FunctionHelper.executeAndCollectEach(userData, (item) => {

            if (item.name === 'Andrew') {

                return [item.name, item.lastName];
            }

            return item.name;
        }).then((resolve) => {
            expect(resolve.length).to.equal(3);
        });
    });

    it('execute and collect empty list ', () => {
        return FunctionHelper.executeAndCollectEach(null, (item) => {

            if (item.name === 'Andrew') {

                return [item.name, item.lastName];
            }

            return item.name;
        }).then((resolve) => {
            expect(resolve.length).not.to.exist();
        });
    });
});
