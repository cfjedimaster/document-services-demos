/*
Demonstrate getting the metadata properties for a PDF.
*/

const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

//clean up previous
(async ()=> {

	// hamlet.docx was too big for conversion
	const input = './hamlet.pdf';
	const creds = './pdftools-api-credentials.json';

	let result = await getPDFProperties(input, creds);
	console.log('Got result:', JSON.stringify(result, null, '\t'));

})();

async function getPDFProperties(source, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
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
			if(err instanceof PDFToolsSdk.Error.ServiceApiError
			|| err instanceof PDFToolsSdk.Error.ServiceUsageError) {
				reject(err);
			} else {
				reject(err);
			}
		});

	});
}
