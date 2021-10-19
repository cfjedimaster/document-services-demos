/*
testing a possible issue where you can't immediately delete a generated file
*/

const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

const inputFile = './hamlet.docx';
const output = './hello.pdf';

const creds = './pdftools-api-credentials.json';

if(fs.existsSync(output)) fs.unlinkSync(output);

const credentials =  pdfSDK.Credentials
.serviceAccountCredentialsBuilder()
.fromFile(creds)
.build();

const executionContext = pdfSDK.ExecutionContext.create(credentials),
		createPdfOperation = pdfSDK.CreatePDF.Operation.createNew();

// Set operation input from a source file
const input = pdfSDK.FileRef.createFromLocalFile(inputFile);
createPdfOperation.setInput(input);

// Execute the operation and Save the result to the specified location.
createPdfOperation.execute(executionContext)
.then(result => {
		
	result.saveAsFile(output)
	.then(() => {
		console.log('in the then to save the file');
		fs.unlinkSync(output);
		console.log('file deleted');
	});

})
.catch(err => {
	if(err instanceof pdfSDK.Error.ServiceApiError
	|| err instanceof pdfSDK.Error.ServiceUsageError) {
	} else {
	}
});

