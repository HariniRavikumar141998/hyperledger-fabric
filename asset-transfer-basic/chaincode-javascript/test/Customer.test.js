/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const Customer = require('../lib/Customer.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Asset Transfer Basic Tests', () => {
    let transactionContext, chaincodeStub, Customer;
    beforeEach(() => {
        transactionContext = new Context();

        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    // Shallow copy
                    const copied = Object.assign({}, chaincodeStub.states);

                    for (let key in copied) {
                        yield {value: copied[key]};
                    }
                }
            }

            return Promise.resolve(internalGetStateByRange());
        });

        Customer = {
            CustomerId: 1,
            Role: 'Customer',
            Name: xxyy,
        };
    });

    describe('Test InitLedger', () => {
        it('should return error on InitLedger', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            let customer = new Customer();
            try {
                await customer.InitLedger(transactionContext);
                assert.fail('InitLedger should have failed');
            } catch (err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on InitLedger', async () => {
            let customer = new Customer();
            await customer.InitLedger(transactionContext);
            let ret = JSON.parse((await chaincodeStub.getState(1)).toString());
            expect(ret).to.eql(Object.assign({docType: 'Customer'}, Customer));
        });
    });

    describe('Test CreateCustomer', () => {
        it('should return error on CreateCustomer', async () => {
            chaincodeStub.putState.rejects('failed inserting key');

            let customer = new Customer();
            try {
                await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);
                assert.fail('CreateCustomer should have failed');
            } catch(err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on CreateCustomer', async () => {
            let customer = new Customer();

            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            let ret = JSON.parse((await chaincodeStub.getState(Customer.Id)).toString());
            expect(ret).to.eql(Customer);
        });
    });

    describe('Test ReadCustomer', () => {
        it('should return error on ReadCustomer', async () => {
            let customer = new Customer();
            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            try {
                await customer.ReadCustomer(transactionContext, 2);
                assert.fail('ReadCustomer should have failed');
            } catch (err) {
                expect(err.message).to.equal('The Customer 2 does not exist');
            }
        });

        it('should return success on ReadCustomer', async () => {
            let customer = new Customer();
            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            let ret = JSON.parse(await chaincodeStub.getState(Customer.Id));
            expect(ret).to.eql(Customer);
        });
    });

    describe('Test UpdateCustomer', () => {
        it('should return error on UpdateCustomer', async () => {
            let customer = new Customer();
            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            try {
                await customer.UpdateCustomer(transactionContext, '2', 'Customer','yyxx');
                assert.fail('UpdateCustomer should have failed');
            } catch (err) {
                expect(err.message).to.equal('The Customer 2 does not exist');
            }
        });

        it('should return success on UpdateCustomer', async () => {
            let customer = new Customer();
            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            await customer.UpdateCustomer(transactionContext, 1, 'Customer' ,'xxyy');
            let ret = JSON.parse(await chaincodeStub.getState(Customer.Id));
            let expected = {
                CustomerId: 1,
                Role: 'Customer',
                Name: 'xxyy',
            };
            expect(ret).to.eql(expected);
        });
    });

    describe('Test DeleteCustomer', () => {
        it('should return error on DeleteCustomer', async () => {
            let customer = new Customer();
            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            try {
                await customer.DeleteCustomer(transactionContext, 2);
                assert.fail('DeleteCustomer should have failed');
            } catch (err) {
                expect(err.message).to.equal('The Customer 2 does not exist');
            }
        });

        it('should return success on DeleteCustomer', async () => {
            let customer = new Customer();
            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            await customer.DeleteCustomer(transactionContext, Customer.Id);
            let ret = await chaincodeStub.getState(Customer.Id);
            expect(ret).to.equal(undefined);
        });
    });

    describe('Test TransferCustomer', () => {
        it('should return error on TransferCustomer', async () => {
            let customer = new Customer();
            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            try {
                await customer.Customer(transactionContext, 2, 'yyxx');
                assert.fail('DeleteCustomer should have failed');
            } catch (err) {
                expect(err.message).to.equal('The Customer 2 does not exist');
            }
        });

        it('should return success on Customer', async () => {
            let customer = new Customer();
            await customer.CreateCustomer(transactionContext, Customer.Id, Customer.Role, Customer.Name);

            await customer.TransferCustomer(transactionContext, Customer.Id, 'yyxx');
            let ret = JSON.parse((await chaincodeStub.getState(asset.Id)).toString());
            expect(ret).to.eql(Object.assign({}, customer, {Owner: 'xxyy'}));
        });
    });

    describe('Test GetAllCustomers', () => {
        it('should return success on GetAllCustomers', async () => {
            let customer = new Customer();

            await customer.CreateCustomer(transactionContext, 1, 'Customer', 'xxyy');
            await customer.CreateCustomer(transactionContext, 2, 'Customer', 'yyxx');
            await customer.CreateCustomer(transactionContext, 3, 'Customer', 'xyxy');
            await customer.CreateCustomer(transactionContext, 4, 'Customer', 'yxyx');

            let ret = await customer.GetAllCustomers(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(4);

            let expected = [
                {Record: {CustomerId: 1, Role: 'Customer', Name: 'xxyy'}},
                {Record: {CustomerId: 2, Role: 'Customer', Name: 'yyxx'}},
                {Record: {CustomerId: 3, Role: 'Customer', Name: 'xyxy'}},
                {Record: {CustomerId: 4, Role: 'Customer', Name: 'yxyx'}}
            ];

            expect(ret).to.eql(expected);
        });

        it('should return success on GetAllCustomers for non JSON value', async () => {
            let customer = new Customer();

            chaincodeStub.putState.onFirstCall().callsFake((key, value) => {
                if (!chaincodeStub.states) {
                    chaincodeStub.states = {};
                }
                chaincodeStub.states[key] = 'non-json-value';
            });

            await customer.CreateCustomer(transactionContext, 1, 'Customer','xxyy');
            await customer.CreateCustomer(transactionContext, 2, 'Customer','yyxx');
            await customer.CreateCustomer(transactionContext, 3, 'Customer', 'xyxy');
            await customer.CreateCustomer(transactionContext, 4, 'Customer','yxyx');

            let ret = await customer.GetAllCustomers(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(4);

            let expected = [
                {Record: 'non-json-value'},
                {Record: {CustomerId: 2, Role: 'Customer', Name:'yyxx'}},
                {Record: {CustomerId: 3, Role: 'Customer', Name:'xyxy'}},
                {Record: {CustomerId: 4, Role: 'Customer', Name:'yxyx'}}
            ];

            expect(ret).to.eql(expected);
        });
    });
});
