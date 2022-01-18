/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Customer extends Contract {

    async InitLedger(ctx) {
        const Customer = [
            {
                CustomerId: 1,
                Role: 'Customer',
                Name: 'xxyy',
            },
            {
                CustomerId: 2,
                Role: 'Customer',
                Name: 'yyxx',
            },
            {
                CustomerId: 3,
                Role: 'Customer',
                Name: 'xyxy',
            },
            {
                CustomerId: 4,
                Role: 'Customer',
                Name: 'yxyx',
            },
            {
                CustomerId: 5,
                Role: 'Customer',
                Name: 'xyyx',
            },
            {
                CustomerId: 6,
                Role: 'Customer',
                Name: 'yxxy',
            },
        ];

        const InsuranceObject = [
            {
                InsuranceId: 1,
                Type: 'Car',
                Status: 0,
                Amount: 8800,
                Adhar:'yes',
                DamageImages:'yes', 
                VerifiedInvoice:'yes'
            },
            {
                InsuranceId: 2,
                Type: 'Car',
                Status: 1,
                Amount: 7689,
                Adhar:'yes',
                DamageImages:'yes', 
                VerifiedInvoice:'yes'
            },
            {
                InsuranceId: 3,
                Type: 'Car',
                Status: 2,
                Amount: 4532,
                Adhar:'yes',
                DamageImages:'yes', 
                VerifiedInvoice:'yes'
            },
            {
                InsuranceId: 4,
                Type: 'Car',
                Status: 3,
                Amount: 9867,
                Adhar:'yes',
                DamageImages:'yes', 
                VerifiedInvoice:'yes'
            },
            {
                InsuranceId: 5,
                Type: 'Car',
                Status: 1,
                Amount: 9867,
                Adhar:'yes',
                DamageImages:'yes', 
                VerifiedInvoice:'yes'
            },
            {
                InsuranceId: 6,
                Type: 'Car',
                Status: 3,
                Amount: 5555,
                Adhar:'yes',
                DamageImages:'yes', 
                VerifiedInvoice:'yes'
            },
        ];

        const Insurance = [
            {
                InsuranceId: 1,
                Role: 'Insurance',
                Name: 'xxyy',
            },
            {
                InsuranceId: 2,
                Role: 'Insurance',
                Name: 'yyxx',
            },
            {
                InsuranceId: 3,
                Role: 'Insurance',
                Name: 'xyxy',
            },
            {
                InsuranceId: 4,
                Role: 'Insurance',
                Name: 'yxyx',
            },
            {
                InsuranceId: 5,
                Role: 'Insurance',
                Name: 'xyyx',
            },
            {
                InsuranceId: 6,
                Role: 'Insurance',
                Name: 'yxxy',
            },
        ];

        const Bank = [
            {
                BankId: 1,
                Role: 'Bank',
                Name: 'xxyy',
            },
            {
                BankId: 2,
                Role: 'Bank',
                Name: 'yyxx',
            },
            {
                BankId: 3,
                Role: 'Bank',
                Name: 'xyxy',
            },
            {
                BankId: 4,
                Role: 'Bank',
                Name: 'yxyx',
            },
            {
                BankId: 5,
                Role: 'Bank',
                Name: 'xyyx',
            },
            {
                BankId: 6,
                Role: 'Bank',
                Name: 'yxxy',
            },
        ];


       for (const customer of Customer) {
            customer.docType = 'Customer';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(Customer.Id, Buffer.from(stringify(sortKeysRecursive(Customer))));
        }

        for (const insurance of Insurance) {
            insurance.docType = 'Insurance';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(Insurance.Id, Buffer.from(stringify(sortKeysRecursive(Insurance))));
        }

        for (const insuranceobject of InsuranceObject) {
            insuranceobject.docType = 'InsuranceObject';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(Insurance.Id, Buffer.from(stringify(sortKeysRecursive(InsuranceObject))));
        }

        for (const bank of Bank) {
            bank.docType = 'Bank';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(Bank.Id, Buffer.from(stringify(sortKeysRecursive(Bank))));
        }
    }



    // CreateAsset issues a new asset to the world state with given details.
    async CreateCustomer(ctx, customerid, role, name) {
        const exists = await this.CustomerExists(ctx, customerid);
        if (exists) {
            throw new Error(`The Customer ${customerid} already exists`);
        }

        const Customer = {
            CustomerId: customerid,
            Role: role,
            Name: name,
        };
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(customerid, Buffer.from(stringify(sortKeysRecursive(Customer))));
        return JSON.stringify(Customer);
    }

    async CreateBank(ctx, bankid, role, name) {
        const exists = await this.BankExists(ctx, bankid);
        if (exists) {
            throw new Error(`The Bank ${bankid} already exists`);
        }

        const Bank = {
            BankId: bankid,
            Role: role,
            Name: name,
        };
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(bankid, Buffer.from(stringify(sortKeysRecursive(Bank))));
        return JSON.stringify(Bank);
    }

    async CreateInsurance(ctx, insuranceid, role, name) {
        const exists = await this.InsuranceExists(ctx, insuranceid);
        if (exists) {
            throw new Error(`The Insurance ${insuranceid} already exists`);
        }

        const Insurance = {
            InsuranceId: insuranceid,
            Role: role,
            Name: name,
        };
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(insuranceid, Buffer.from(stringify(sortKeysRecursive(Insurance))));
        return JSON.stringify(Insurance);
    }

    async CreateInsuranceObject(ctx, insuranceid, type, status, amount, adhar, damageimages, verifiedinvoice) {
        const exists = await this.InsuranceObjectExists(ctx, insuranceid);
        if (exists) {
            throw new Error(`The InsuranceObject ${insuranceid} already exists`);
        }
            //const status = await this.StatusExists(ctx, statusid);
            // if(status) {
            //     throw new Error(`The Status ${status} does not exists`);
            // }
            

        const InsuranceObject = {
            InsuranceId: insuranceid,
            Type: type,
            Status: status,
            Amount: amount,
            Adhar: adhar,
            DamageImages: damageimages,
            VerifiedInvoice: verifiedinvoice,
        };
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(insuranceid, Buffer.from(stringify(sortKeysRecursive(InsuranceObject))));
        return JSON.stringify(InsuranceObject);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadCustomer(ctx, customerid) {
        const CustomerJSON = await ctx.stub.getState(customerid); // get the asset from chaincode state
        if (!CustomerJSON || CustomerJSON.length === 0) {
            throw new Error(`The Customer ${customerid} does not exist`);
        }
        return CustomerJSON.toString();
    }

    async ReadBank(ctx, bankid) {
        const BankJSON = await ctx.stub.getState(bankid); // get the asset from chaincode state
        if (!BankJSON || BankJSON.length === 0) {
            throw new Error(`The Customer ${bankid} does not exist`);
        }
        return BankJSON.toString();
    }

    async ReadInsurance(ctx, insuranceid) {
        const InsuranceJSON = await ctx.stub.getState(insuranceid); // get the asset from chaincode state
        if (!InsuranceJSON || InsuranceJSON.length === 0) {
            throw new Error(`The Insurance ${insuranceid} does not exist`);
        }
        return InsuranceJSON.toString();
    }

    async ReadInsuranceObject(ctx, insuranceid) {
        const InsuranceObjectJSON = await ctx.stub.getState(insuranceid); // get the asset from chaincode state
        if (!InsuranceObjectJSON || InsuranceObjectJSON.length === 0) {
            throw new Error(`The InsuranceObject ${insuranceid} does not exist`);
        }
        return InsuranceObjectJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateCustomer(ctx, customerid, role, name) {
        const exists = await this.CustomerExists(ctx, customerid);
        if (!exists) {
            throw new Error(`The Customer ${customerid} does not exist`);
        }
        // overwriting original asset with new asset
        const updatedCustomer = {
            CustomerId: customerid,
            Role: role,
            Name: name,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(customerid, Buffer.from(stringify(sortKeysRecursive(updatedCustomer))));
    }

    async UpdateBank(ctx, bankid, role, name) {
        const exists = await this.BankExists(ctx, bankid);
        if (!exists) {
            throw new Error(`The Bank ${bankid} does not exist`);
        }
        // overwriting original asset with new asset
        const updatedBank = {
            BankId: bankid,
            Role: role,
            Name: name,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(bankid, Buffer.from(stringify(sortKeysRecursive(updatedBank))));
    }

    async UpdateInsurance(ctx, insuranceid, role, name) {
        const exists = await this.InsuranceExists(ctx, insuranceid);
        if (!exists) {
            throw new Error(`The Insurance ${insuranceid} does not exist`);
        }

    

        // overwriting original asset with new asset
        const updatedInsurance = {
            InsuranceId: insuranceid,
            Role: role,
            Name: name,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(insuranceid, Buffer.from(stringify(sortKeysRecursive(updatedInsurance))));
    }

    async UpdateInsuranceObject(ctx, insuranceid, type, status, amount, adhar,damageimages,verifiedinvoice) {
        const exists = await this.InsuranceObjectExists(ctx, insuranceid);
        if (!exists) {
            throw new Error(`The InsuranceObject ${insuranceid} does not exist`);
        }

    

        // overwriting original asset with new asset
        const updatedInsuranceObject = {
            InsuranceId: insuranceid,
            Type: type,
            Status: status,
            Amount: amount,
            Adhar: adhar,
            DamageImages:damageimages, 
            VerifiedInvoice:verifiedinvoice
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(insuranceid, Buffer.from(stringify(sortKeysRecursive(updatedInsuranceObject))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteCustomer(ctx, customerid) {
        const exists = await this.CustomerExists(ctx, customerid);
        if (!exists) {
            throw new Error(`The Customer ${customerid} does not exist`);
        }
        return ctx.stub.deleteState(customerid);
    }

    async DeleteBank(ctx, bankid) {
        const exists = await this.BankExists(ctx, bankid);
        if (!exists) {
            throw new Error(`The Bank ${bankid} does not exist`);
        }
        return ctx.stub.deleteState(bankid);
    }

    async DeleteInsurance(ctx, insuranceid) {
        const exists = await this.InsuranceExists(ctx, insuranceid);
        if (!exists) {
            throw new Error(`The Insurance ${insuranceid} does not exist`);
        }
        return ctx.stub.deleteState(insuranceid);
    }

    // async DeleteInsuranceObject(ctx, insuranceid) {
    //     const exists = await this.InsuranceObjectExists(ctx, insuranceid);
    //     if (!exists) {
    //         throw new Error(`The InsuranceObject ${insuranceid} does not exist`);
    //     }
    //     return ctx.stub.deleteState(insuranceid);
    // }

    // AssetExists returns true when asset with given ID exists in world state.
    async CustomerExists(ctx, customerid) {
        const CustomerJSON = await ctx.stub.getState(customerid);
        return CustomerJSON && CustomerJSON.length > 0;
    }

    async BankExists(ctx, bankid) {
        const BankJSON = await ctx.stub.getState(bankid);
        return BankJSON && BankJSON.length > 0;
    }

    async InsuranceExists(ctx, insuranceid) {
        const InsuranceJSON = await ctx.stub.getState(insuranceid);
        return InsuranceJSON && InsuranceJSON.length > 0;
    }
    // async StatusExists(ctx, status) {
    //     if(status == 0){
    //         console.log("customer add the settlement request");
            
    //     }
    //     else if(status == 1){
    //         console.log("updated by insurance compny after the visiting to the customer hone and cliclking picture of car");
          
    //     }
    //     else if(status == 2){
    //         console.log("bank will pay the insurance money to customer");
           
    //     }
    //     else{
    //         console.log("updated staus by insuarance comapny for rejection of settlemet damageImages: NO");
            
    //     }
    // }
    async InsuranceObjectExists(ctx, insuranceid) {
        const InsuranceObjectJSON = await ctx.stub.getState(insuranceid);
        return InsuranceObjectJSON && InsuranceObjectJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferCustomer(ctx, customerid, newOwner) {
        const CustomerString = await this.ReadCustomer(ctx, customerid);
        const Customer = JSON.parse(CustomerString);
        const oldOwner = Customer.Owner;
        Customer.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        ctx.stub.putState(customerid, Buffer.from(stringify(sortKeysRecursive(Customer))));
        return oldOwner;
    }

    async TransferBank(ctx, bankid, newOwner) {
        const BankString = await this.ReadBank(ctx, bankid);
        const Bank = JSON.parse(BankString);
        const oldOwner = Bank.Owner;
        Bank.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        ctx.stub.putState(bankid, Buffer.from(stringify(sortKeysRecursive(Bank))));
        return oldOwner;
    }

    async TransferInsurance(ctx, insuranceid, newOwner) {
        const InsuranceString = await this.ReadInsurance(ctx, insuranceid);
        const Insurance = JSON.parse(InsuranceString);
        const oldOwner = Insurance.Owner;
        Insurance.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        ctx.stub.putState(insuranceid, Buffer.from(stringify(sortKeysRecursive(Insurance))));
        return oldOwner;
    }

    async TransferInsuranceObject(ctx, insuranceid, newOwner) {
        const InsuranceObjectString = await this.ReadInsuranceObject(ctx, insuranceid);
        const InsuranceObject = JSON.parse(InsuranceObjectString);
        const oldOwner = InsuranceObject.Owner;
        InsuranceObject.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        ctx.stub.putState(insuranceid, Buffer.from(stringify(sortKeysRecursive(InsuranceObject))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllCustomers(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GetAllBank(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GetAllInsurance(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GetAllInsuranceObject(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = Customer;
