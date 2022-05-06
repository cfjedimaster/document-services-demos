const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const creds = './pdftools-api-credentials.json';

(async () => {

	// change when you test...
	let inputPDF = '/mnt/c/Users/ray/OneDrive/Work/clienttesting/jazel/copy.pdf';
	let outputPDF = '/mnt/c/Users/ray/OneDrive/Work/clienttesting/jazel/copy_nosecurity.pdf';


	const credentials =  pdfSDK.Credentials.serviceAccountCredentialsBuilder().fromFile(creds).build();
	
	// Create an ExecutionContext using credentials
	const executionContext = pdfSDK.ExecutionContext.create(credentials);
	
	// Create a new operation instance.
	const removeProtectionOperation = pdfSDK.RemoveProtection.Operation.createNew(),
		input = pdfSDK.FileRef.createFromLocalFile(inputPDF,
			pdfSDK.RemoveProtection.SupportedSourceFormat.pdf
		);

	// Set operation input from a source file.
	removeProtectionOperation.setInput(input);
	
	// Set the password for removing security from a PDF document.
	removeProtectionOperation.setPassword("1234567");
	
	// Execute the operation and Save the result to the specified location.
	removeProtectionOperation.execute(executionContext)
	.then(result => result.saveAsFile(outputPDF))
	.catch(err => {
		if(err instanceof pdfSDK.Error.ServiceApiError
			|| err instanceof pdfSDK.Error.ServiceUsageError) {
			console.log('Exception encountered while executing operation', err);
		} else {
			console.log('Exception encountered while executing operation', err);
		}
	});


})();
