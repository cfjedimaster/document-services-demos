/*
My purpose is to demonstrate doing 2+ things w/ the SDK without having to use the file system in the middle.
So read from the FS for input to op 1 (OCR a PDF), save to stream, pass stream to op 2 (optimize a PDF), then save
to FS

Update on May 25 as I'm about to check this into Git and it won't be pretty. TIL that you can pass the FileRef
result from one op to another! No need to save it. So this mean it's fairly trivial then to handle N operations.

This code is somehwat ugly now, but will be something I can demo nicer later.
*/

const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');
const fs = require('fs');

//clean up previous
(async ()=> {

	// hamlet.docx was too big for conversion
	const input = './hamlet2.docx';
	const output = './multi.pdf';
	const creds = './pdftools-api-credentials.json';

	if(fs.existsSync(output)) fs.unlinkSync(output);

	let result = await createPDF(input, creds);
	console.log('got a result');
	result = await ocrPDF(result, creds);
	console.log('got second result');

	await result.saveAsFile(output);

})();

async function createPDF(source, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  PDFToolsSdk.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = PDFToolsSdk.ExecutionContext.create(credentials),
				createPdfOperation = PDFToolsSdk.CreatePDF.Operation.createNew();

		// Set operation input from a source file
		const input = PDFToolsSdk.FileRef.createFromLocalFile(source);
		createPdfOperation.setInput(input);

		let stream = new Stream.Writable();
		stream.write = function() {

		}
		
		stream.end = function() {
			console.log('end called');
			resolve(stream);
		}

		// Execute the operation and Save the result to the specified location.
		createPdfOperation.execute(executionContext)
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

async function ocrPDF(source, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  PDFToolsSdk.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = PDFToolsSdk.ExecutionContext.create(credentials),
  			ocrOperation = PDFToolsSdk.OCR.Operation.createNew();

		// Set operation input from a source file.
		//const input = PDFToolsSdk.FileRef.createFromStream(source);
		ocrOperation.setInput(source);

		let stream = new Stream.Writable();
		stream.end = function() {
			console.log('end called');
			resolve(stream);
		}

		// Execute the operation and Save the result to the specified location.
		ocrOperation.execute(executionContext)
       .then(result => resolve(result))
       .catch(err => reject(err));

	});
}


