/*
My purpose is to demonstrate doing 2+ things w/ the SDK without having to use the file system in the middle.
So read from the FS for input to op 1 (OCR a PDF), save to stream, pass stream to op 2 (optimize a PDF), then save
to FS

Update on May 25 as I'm about to check this into Git and it won't be pretty. TIL that you can pass the FileRef
result from one op to another! No need to save it. So this mean it's fairly trivial then to handle N operations.

This code is somehwat ugly now, but will be something I can demo nicer later.
*/

const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

//clean up previous
(async ()=> {

	// hamlet.docx was too big for conversion
	const input = './hamlet2.docx';
	const output = './multi.pdf';
	const creds = './pdftools-api-credentials.json';

	if(fs.existsSync(output)) fs.unlinkSync(output);

	let result = await createPDF(input, creds);
	console.log('got result from making a pdf');
	result = await protectPDF(result, '12345', creds);
	console.log('got result from password protecting pdf');

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

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
  			ocrOperation = pdfSDK.OCR.Operation.createNew();

		// Set operation input from a source file.
		ocrOperation.setInput(source);


		// Execute the operation and Save the result to the specified location.
		ocrOperation.execute(executionContext)
       .then(result => resolve(result))
       .catch(err => reject(err));

	});
}


async function protectPDF(source, password, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials);
		const protectPDF = pdfSDK.ProtectPDF,
			options = new protectPDF.options.PasswordProtectOptions.Builder()
			.setUserPassword(password)
			.setEncryptionAlgorithm(pdfSDK.ProtectPDF.options.EncryptionAlgorithm.AES_256)
			.build();		

		const protectPDFOperation = protectPDF.Operation.createNew(options);

		// Set operation input from a source file.
		protectPDFOperation.setInput(source);


		// Execute the operation and Save the result to the specified location.
		protectPDFOperation.execute(executionContext)
       .then(result => resolve(result))
       .catch(err => reject(err));

	});
}

/*
original demo had create/ocr, which doesnt make sense. Keeping this func cuz I like it
*/
async function ocrPDF(source, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
  			ocrOperation = pdfSDK.OCR.Operation.createNew();

		// Set operation input from a source file.
		//const input = PDFToolsSdk.FileRef.createFromStream(source);
		ocrOperation.setInput(source);


		// Execute the operation and Save the result to the specified location.
		ocrOperation.execute(executionContext)
       .then(result => resolve(result))
       .catch(err => reject(err));

	});
}


