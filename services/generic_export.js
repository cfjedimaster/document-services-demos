const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const chalk = require('chalk');

(async ()=> {

	const input = process.argv[2];
	const output = process.argv[3];
	if(!input || !output) {
		console.log('Usage: node generic_export.js pathToPDF pathToOutput');
		process.exit(1);
	}

	if(!input || !output) {
		console.error(chalk.red('Syntax: generic.js <input pdf doc> <output file>'));
		process.exit(1);
	}

	if(!fs.existsSync(input)) {
		console.error(chalk.red(`Can't find input file ${input}`));
		process.exit(1);
	}

	// careful....
	if(fs.existsSync(output)) fs.unlinkSync(output);
	let fileRef = await exportPDF(input, output, './pdftools-api-credentials.json');
	fileRef.saveAsFile(output);
	console.log(chalk.green(`Exported ${output} from ${input}`));

})();

async function exportPDF(source, output, creds) {

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
			reject(`Invalid extension provided for output, ${ext}`);
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