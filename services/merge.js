const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const creds = './pdftools-api-credentials.json';

(async () => {

	let filesToMerge = [];
	if(process.argv.length < 4) {
		console.log("Usage: node merge.js FILEA,FILEB,FILEC OUTPUT");
		process.exit(1);
	}

	let inputFiles = process.argv[2].split(',');
	for(let i=0; i<inputFiles.length;i++) {
		if(!fs.existsSync(inputFiles[i])) {
			console.log(`The file, ${inputFiles[i]}, does not exist.`);
			process.exit(1);
		}
		filesToMerge.push(inputFiles[i]);
	}

	console.log(`To merge: ${filesToMerge}`);

	let output = process.argv[3];
	if(fs.existsSync(output)) {
		console.log(`The output file, ${output}, already exists. Please remove it first.`);
		process.exit(1);
	}

	await mergeFiles(filesToMerge, output, creds);
	console.log(`Done. Final result saved to ${output}.`);

})();

async function mergeFiles(input, output, creds) {

	return new Promise((resolve, reject) => {

		const credentials = pdfSDK.Credentials.serviceAccountCredentialsBuilder().fromFile(creds).build();

		// Create an ExecutionContext using credentials and create a new operation instance.
		const executionContext = pdfSDK.ExecutionContext.create(credentials), 
		combineFilesOperation = pdfSDK.CombineFiles.Operation.createNew();

		for(let i=0; i<input.length; i++) {
			let source = pdfSDK.FileRef.createFromLocalFile(input[i]);
			combineFilesOperation.addInput(source);
		}

		// Execute the operation and Save the result to the specified location.
		combineFilesOperation.execute(executionContext)
			.then(result => result.saveAsFile(output))
			.then(result => resolve())
			.catch(err => {
				if (err instanceof pdfSDK.Error.ServiceApiError
					|| err instanceof pdfSDK.Error.ServiceUsageError) {
					reject(err);
				} else {
					reject(err);
				}
			});

	});

}