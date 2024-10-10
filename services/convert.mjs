/*
New version of generic_export.js that goes two ways, you can either go from X to PDF or PDF to X.
This version will not overwrite
*/

import chalk from 'chalk';
import fs from 'fs';
import ServicesWrapper from '../../acrobatserviceswrapper/index.js';


(async ()=> {

	let input = process.argv[2];
	let output = process.argv[3];

	let CLIENT_ID = process.env.CLIENT_ID;
	let CLIENT_SECRET = process.env.CLIENT_SECRET;
	let sw = new ServicesWrapper(CLIENT_ID, CLIENT_SECRET);

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
	
	if(output.toLowerCase().indexOf('.pdf') >= 0) {
		try {

			let asset = await sw.upload(input);
			console.log('Doc uploaded');

			let job = await sw.createPDFJob(asset);
			console.log('Create job started.');

			await sw.downloadWhenDone(job, output);
			console.log('Job done');


		} catch(e) {
			console.log(chalk.red(`Error: ${JSON.stringify(e)}`));
			process.exit(1);
		}
		
	} else {
		try {
			fileRef = await exportDoc(input, output, './pdfservices-api-credentials.json');
			fileRef.saveAsFile(output);
		} catch(e) {
			console.log(chalk.red(`Error: ${JSON.stringify(e)}`));
			process.exit(1);
		}
	}

	console.log(chalk.green(`Exported ${output} from ${input}`));

})();

async function exportDoc(source, output) {

    return new Promise((resolve, reject) => {

		const credentials = pdfSDK.Credentials
         .servicePrincipalCredentialsBuilder()
         .withClientId(process.env.CLIENT_ID)
         .withClientSecret(process.env.CLIENT_SECRET)
         .build()

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

async function exportPDF(input, output, token) {

    return new Promise((resolve, reject) => {

		const credentials = pdfSDK.Credentials
         .servicePrincipalCredentialsBuilder()
         .withClientId(process.env.CLIENT_ID)
         .withClientSecret(process.env.CLIENT_SECRET)
         .build()

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