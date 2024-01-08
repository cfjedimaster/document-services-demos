/*
Demonstrate getting the metadata properties for a PDF.
*/
require('dotenv').config();

const pdfSDK = require('@adobe/pdfservices-node-sdk');
const chalk = require('chalk');

(async ()=> {

	let inputPDF = process.argv[2];

	if(!inputPDF) {
		console.error(chalk.red('Syntax: properties.js <input pdf doc> '));
		process.exit(1);
	}


	let result = await getPDFProperties(inputPDF);
	console.log(JSON.stringify(result, null, '\t'));

})();

async function getPDFProperties(source, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
			.servicePrincipalCredentialsBuilder()
			.withClientId(process.env.CLIENT_ID)
			.withClientSecret(process.env.CLIENT_SECRET)
			.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
			pdfOperation = pdfSDK.PDFProperties.Operation.createNew();

		// Set operation input from a source file
		const input = pdfSDK.FileRef.createFromLocalFile(source);
		pdfOperation.setInput(input);

		// Provide any custom configuration options for the operation.
		const options = new pdfSDK.PDFProperties.options.PDFPropertiesOptions.Builder()
		.includePageLevelProperties(true)
		.build();
		pdfOperation.setOptions(options);

		// Execute the operation and Save the result to the specified location.
		pdfOperation.execute(executionContext)
		.then(result => resolve(result))
		.catch(err => {
			if(err instanceof pdfSDK.Error.ServiceApiError
			|| err instanceof pdfSDK.Error.ServiceUsageError) {
				reject(err);
			} else {
				reject(err);
			}
		});

	});
}
