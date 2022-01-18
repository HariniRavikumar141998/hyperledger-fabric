/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1,buildCCPOrg2,buildCCPOrg3, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const mspOrg2 = 'Org2MSP';
const mspOrg3 = 'Org3MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use any of the asset-transfer-basic chaincodes deployed on the channel "mychannel"
//   with the chaincode name of "basic". The following deploy command will package,
//   install, approve, and commit the javascript chaincode, all the actions it takes
//   to deploy a chaincode to a channel.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
// - Be sure that node.js is installed
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node -v
// - npm installed code dependencies
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         npm install
// - to run this test application
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node app.js

// NOTE: If you see  kind an error like these:
/*
    2020-08-07T20:23:17.590Z - error: [DiscoveryService]: send[mychannel] - Channel:mychannel received discovery error:access denied
    ******** FAILED to run the application: Error: DiscoveryService: mychannel error: access denied

   OR

   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]
   ******** FAILED to run the application: Error: Identity not found in wallet: appUser
*/
// Delete the /fabric-samples/asset-transfer-basic/application-javascript/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

/**
 *  A test application to show basic queries operations with any of the asset-transfer-basic chaincodes
 *   -- How to submit a transaction
 *   -- How to query and check the results
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */
async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.
			console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of Customer on the ledger');
			await contract.submitTransaction('InitLedger');
			console.log('*** Result: committed');

			// Let's try a query type operation (function).
			// This will be sent to just one peer and the results will be shown.
			console.log('\n--> Evaluate Transaction: GetAllCustomers, function returns all the current Customer on the ledger');
			let result = await contract.evaluateTransaction('GetAllCustomers');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// Now let's try to submit a transaction.
			// This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
			// to the orderer to be committed by each of the peer's to the channel ledger.
			console.log('\n--> Submit Transaction: CreateCustomer, creates new Customer with ID, color, owner, size, and appraisedValue arguments');
			result = await contract.submitTransaction('CreateCustomer', 13, 'Customer', 'xyyx');
			console.log('*** Result: committed');
			if (`${result}` !== '') {
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			}

			console.log('\n--> Evaluate Transaction: ReadCustomer, function returns an Customer with a given CustomerId');
			result = await contract.evaluateTransaction('ReadCustomer', 13);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: CustomerExists, function returns "true" if an Customer with given CustomerId exist');
			result = await contract.evaluateTransaction('CustomerExists', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Submit Transaction: UpdateCustomer 1, change the name to rrrr');
			await contract.submitTransaction('UpdateCustomer', 1, 'Customer', 'rrrr');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: ReadCustomer, function returns 1 attributes');
			result = await contract.evaluateTransaction('ReadCustomer', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			try {
				// How about we try a transactions where the executing chaincode throws an error
				// Notice how the submitTransaction will throw an error containing the error thrown by the chaincode
				console.log('\n--> Submit Transaction: UpdateCustomer 70, 70 does not exist and should return an error');
				await contract.submitTransaction('UpdateCustomer', 70, 'Customer', 'tyty');
				console.log('******** FAILED to return an error');
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			console.log('\n--> Submit Transaction: TransferCustomer 1, transfer to new owner of Tom');
			await contract.submitTransaction('TransferCustomer', 1, 'Tom');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: ReadCustomer, function returns Customer attributes');
			result = await contract.evaluateTransaction('ReadCustomer', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}





	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg2();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org2.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg2);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg2, org2UserId, 'org2.department2');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org2UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.
			console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of Customer on the ledger');
			await contract.submitTransaction('InitLedger');
			console.log('*** Result: committed');

			// Let's try a query type operation (function).
			// This will be sent to just one peer and the results will be shown.
			console.log('\n--> Evaluate Transaction: GetAllInsurance, function returns all the current Insurance on the ledger');
			let result = await contract.evaluateTransaction('GetAllInsurance');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

		    console.log('\n--> Evaluate Transaction: GetAllInsuranceObject, function returns all the current InsuranceObject on the ledger');
			let output = await contract.evaluateTransaction('GetAllInsuranceObject');
			console.log(`*** Output: ${prettyJSONString(output.toString())}`);


			// Now let's try to submit a transaction.
			// This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
			// to the orderer to be committed by each of the peer's to the channel ledger.
			console.log('\n--> Submit Transaction: CreateInsurance, creates new Insurance with InsuranceId, role, name');
			result = await contract.submitTransaction('CreateInsurance', 13, 'Insurance', 'xyyx');
			console.log('*** Result: committed');
			if (`${result}` !== '') {
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			}

			console.log('\n--> Submit Transaction: CreateInsuranceObject, creates new InsuranceObject with InsuranceId, type, Status, amount, adhar, damageimages, verifiedinvoice');
			output = await contract.submitTransaction('CreateInsuranceObject', 13, 'Car', 0, 45000,"yes","yes","yes");
			console.log('*** Output: committed');
			if (`${output}` !== '') {
				console.log(`*** Output: ${prettyJSONString(output.toString())}`);
			}
			

			console.log('\n--> Evaluate Transaction: ReadInsurance, function returns an Insurance with a given InsuranceId');
			result = await contract.evaluateTransaction('ReadInsurance', 13);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: ReadInsuranceObject, function returns an InsuranceObject with a given InsuranceId');
			output = await contract.evaluateTransaction('ReadInsuranceObject', 13);
			console.log(`*** Output: ${prettyJSONString(output.toString())}`);

			console.log('\n--> Evaluate Transaction: InsuranceExists, function returns "true" if an Insurance with given InsuranceId exist');
			result = await contract.evaluateTransaction('InsuranceExists', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: InsuranceObjectExists, function returns "true" if an InsuranceObject with given InsuranceId exist');
			output = await contract.evaluateTransaction('InsuranceObjectExists', 1);
			console.log(`*** Output: ${prettyJSONString(output.toString())}`);

			console.log('\n--> Submit Transaction: UpdateInsurance 1, change the name to rrrr');
			await contract.submitTransaction('UpdateInsurance', 1, 'Insurance', 'rrrr');
			console.log('*** Result: committed');

			console.log('\n--> Submit Transaction: UpdateInsuranceObject 1, change the type to rrrr');
			await contract.submitTransaction('UpdateInsuranceObject', 1, 'Car', 1, "34000",'no','yes','no');
			console.log('*** Output: committed');

			console.log('\n--> Evaluate Transaction: ReadInsurance, function returns 1 attributes');
			result = await contract.evaluateTransaction('ReadInsurance', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: ReadInsuranceObject, function returns 1 attributes');
			output = await contract.evaluateTransaction('ReadInsuranceObject', 1);
			console.log(`*** Output: ${prettyJSONString(output.toString())}`);

			try {
				// How about we try a transactions where the executing chaincode throws an error
				// Notice how the submitTransaction will throw an error containing the error thrown by the chaincode
				console.log('\n--> Submit Transaction: UpdateInsurance 70, 70 does not exist and should return an error');
				await contract.submitTransaction('UpdateInsurance', 70, 'Insurance', 'tyty');
				console.log('******** FAILED to return an error');
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			try {
				// How about we try a transactions where the executing chaincode throws an error
				// Notice how the submitTransaction will throw an error containing the error thrown by the chaincode
				console.log('\n--> Submit Transaction: UpdateInsuranceObject 70, 70 does not exist and should return an error');
				await contract.submitTransaction('UpdateInsurance', 1, 'Car', "1", "34000",'yes','yes','yes');
				console.log('******** FAILED to return an error');
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			console.log('\n--> Submit Transaction: TransferInsurance 1, transfer to new owner of Tom');
			await contract.submitTransaction('TransferInsurance', 1, 'Tom');
			console.log('*** Result: committed');

			console.log('\n--> Submit Transaction: TransferInsuranceObject 1, transfer to new owner of Tom');
			await contract.submitTransaction('TransferInsuranceObject', 1, 'Tom');
			console.log('*** Output: committed');

			console.log('\n--> Evaluate Transaction: ReadInsurance, function returns Insurance attributes');
			result = await contract.evaluateTransaction('ReadInsurance', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: ReadInsuranceObject, function returns InsuranceObject attributes');
			output = await contract.evaluateTransaction('ReadInsurance', 1);
			console.log(`*** Output: ${prettyJSONString(output.toString())}`);
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}


	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg3();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org3.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg3);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg3, org3UserId, 'org3.department3');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org3UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.
			console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of Bank on the ledger');
			await contract.submitTransaction('InitLedger');
			console.log('*** Result: committed');

			// Let's try a query type operation (function).
			// This will be sent to just one peer and the results will be shown.
			console.log('\n--> Evaluate Transaction: GetAllBank, function returns all the current Bank on the ledger');
			let result = await contract.evaluateTransaction('GetAllBank');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// Now let's try to submit a transaction.
			// This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
			// to the orderer to be committed by each of the peer's to the channel ledger.
			console.log('\n--> Submit Transaction: CreateBank, creates new Bank with BankId, role, name');
			result = await contract.submitTransaction('CreateBank', 13, 'Bank', 'xyyx');
			console.log('*** Result: committed');
			if (`${result}` !== '') {
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			}

			console.log('\n--> Evaluate Transaction: ReadBank, function returns an Bank with a given BankId');
			result = await contract.evaluateTransaction('ReadBank', 13);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: BankExists, function returns "true" if an Bank with given BankId exist');
			result = await contract.evaluateTransaction('BankExists', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Submit Transaction: UpdateBank 1, change the name to rrrr');
			await contract.submitTransaction('UpdateBank', 1, 'Bank', 'rrrr');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: ReadBank, function returns 1 attributes');
			result = await contract.evaluateTransaction('ReadBank', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			try {
				// How about we try a transactions where the executing chaincode throws an error
				// Notice how the submitTransaction will throw an error containing the error thrown by the chaincode
				console.log('\n--> Submit Transaction: UpdateBank 70, 70 does not exist and should return an error');
				await contract.submitTransaction('UpdateBank', 70, 'Bank', 'tyty');
				console.log('******** FAILED to return an error');
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			console.log('\n--> Submit Transaction: TransferBank 1, transfer to new owner of Tom');
			await contract.submitTransaction('TransferBank', 1, 'Tom');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: ReadBank, function returns Bank attributes');
			result = await contract.evaluateTransaction('ReadBank', 1);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();
