const { Readable } = require('stream');
const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

const creds = './pdftools-api-credentials.json';

(async () => {
	let body = fs.readFileSync('./pureb64.txt','utf8');
	body = body.replace('data:application/pdf;base64,','');
	let binaryData = Buffer.from(body, 'base64');

	let stream = new Readable();
	stream.push(binaryData); 
	stream.push(null);
		
	let ref = pdfSDK.FileRef.createFromStream(stream, 'application/pdf');
		
	let properties = await getPDFProperties(ref, creds);
	console.log('got props');

	let properties2 = await getPDFProperties(ref, creds);
	console.log('got props2');
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
        let input;
        if(typeof source === 'object') input = source;
        else input = pdfSDK.FileRef.createFromLocalFile(source);
		
        pdfOperation.setInput(input);

		// Provide any custom configuration options for the operation.
		const options = new pdfSDK.PDFProperties.options.PDFPropertiesOptions.Builder()
		.includePageLevelProperties(true)
		.build();
		pdfOperation.setOptions(options);

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

