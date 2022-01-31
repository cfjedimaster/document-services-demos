/*
Just for when folks ask me to convert shit, I need a quick script for it.
*/

const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

//clean up previous
(async ()=> {

	// hamlet.docx was too big for conversion
	const input = './hamlet2.docx';
	const output = './hello.pdf';
	const creds = './pdftools-api-credentials.json';

	if(fs.existsSync(output)) fs.unlinkSync(output);

	let result = await createPDF(input, creds);
	console.log('got result from making a pdf');

	await result.saveAsFile(output);

})();

async function createPDF(source, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
				createPdfOperation = pdfSDK.CreatePDF.Operation.createNew();

		// Set operation input from a source file
		const input = pdfSDK.FileRef.createFromLocalFile(source);
		createPdfOperation.setInput(input);

		// Execute the operation and Save the result to the specified location.
		createPdfOperation.execute(executionContext)
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