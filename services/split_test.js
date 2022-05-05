const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

const inputPDF = process.argv[2];

if(!fs.existsSync(inputPDF)) {
	console.log(`Can't open the file, ${inputPDF}.`);
	process.exit(1);
}

const credentials =  PDFServicesSdk.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile("pdftools-api-credentials.json")
		.build();

// Create an ExecutionContext using credentials
const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);

// Create a new operation instance.
const splitPDFOperation = PDFServicesSdk.SplitPDF.Operation.createNew(),
	input = PDFServicesSdk.FileRef.createFromLocalFile(inputPDF,
		PDFServicesSdk.SplitPDF.SupportedSourceFormat.pdf
	);

// Set operation input from a source file.
splitPDFOperation.setInput(input);

// Set the maximum number of pages each of the output files can have.
splitPDFOperation.setPageCount(2);

splitPDFOperation.execute(executionContext)
.then(result => {
	let saveFilesPromises = [];
	console.log(`Main split operation done, working with ${result.length} results to save.`);
	for(let i = 0; i < result.length; i++) {
		saveFilesPromises.push(result[i].saveAsFile(`output/splittest_${i}.pdf`));
	}
	Promise.all(saveFilesPromises)
	.then(() => {
		console.log('All done splitting, I think.');
	});
})
.catch(err => {
	if(err instanceof PDFServicesSdk.Error.ServiceApiError
		|| err instanceof PDFServicesSdk.Error.ServiceUsageError) {
		console.log('Exception encountered while executing operation', err);
	} else {
		console.log('Exception encountered while executing operation', err);
	}
});