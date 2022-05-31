/*
New version of generic_export.js that goes two ways, you can either go from X to PDF or PDF to X.
This version will not overwrite
*/

const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const chalk = require('chalk');

(async ()=> {

	const input = process.argv[2];
	const output = process.argv[3];


	if(!input || !output) {
		console.error(chalk.red('Syntax: convert.js <input doc> <output file>'));
		process.exit(1);
	}

	if(!fs.existsSync(input)) {
		console.error(chalk.red(`Can't find input file ${input}`));
		process.exit(1);
	}

	if(fs.existsSync(output)) {
		console.error(chalk.red(`Output file ${output} exists and I refuse to overwrite it.`));
		process.exit(1);
	}

	let fileRef;
	if(output.toLowerCase().indexOf('.pdf') >= 0) {
		try {
			fileRef = await exportPDF(input, output, './pdfservices-api-credentials.json');
			fileRef.saveAsFile(output);
		} catch(e) {
			console.log(chalk.red(`Error: ${e}`));
			process.exit(1);
		}
		
	} else {
		try {
			fileRef = await exportDoc(input, output, './pdfservices-api-credentials.json');
			fileRef.saveAsFile(output);
		} catch(e) {
			console.log(chalk.red(`Error: ${e}`));
			process.exit(1);
		}
	}

	console.log(chalk.green(`Exported ${output} from ${input}`));

})();

async function exportDoc(source, output, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
			.serviceAccountCredentialsBuilder()
			.fromFile(creds)
			.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
				exportPDF = pdfSDK.ExportPDF;

		let exportPdfOperation;
		let ext = output.split('.').pop();

		if(ext === 'docx') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.DOCX);
		} else if(ext === 'doc') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.DOC);
		} else if(ext === 'jpeg') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.JPEG);
		} else if(ext === 'png') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.PNG);
		} else if(ext === 'pptx') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.PPTX);
		} else if(ext === 'rtf') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.RTF);
		} else if(ext === 'xlsx') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.XLSX);
		} else {
			reject(`Invalid extension provided for output: ${ext}`);
		}

		// Set operation input from a source file
		const input = pdfSDK.FileRef.createFromLocalFile(source);
		exportPdfOperation.setInput(input);

		// Execute the operation and Save the result to the specified location.
		exportPdfOperation.execute(executionContext)
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

async function exportPDF(source, output, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
			.serviceAccountCredentialsBuilder()
			.fromFile(creds)
			.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
				createPDF = pdfSDK.CreatePDF.Operation.createNew();


		// Set operation input from a source file
		const input = pdfSDK.FileRef.createFromLocalFile(source);
		createPDF.setInput(input);
		// Execute the operation and Save the result to the specified location.
		createPDF.execute(executionContext)
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