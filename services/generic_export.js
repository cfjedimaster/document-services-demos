const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

(async ()=> {

	const input = process.argv[2];
	const output = process.argv[3];
	if(!input || !output) {
		console.log('Usage: node generic_export.js pathToPDF pathToOutput');
		process.exit(1);
	}

	if(fs.existsSync(output)) fs.unlinkSync(output);
	await exportPDF(input, output, './pdftools-api-credentials.json');
	

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

		let ext = output.split('.').pop().toLowerCase();
		if(ext === 'docx') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.DOCX);
		} else if(ext === 'pptx') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.PPTX);
		} else if(ext === 'rtf') {
			exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.RTF);
		} else {
			reject(`Invalid extension provided for output, ${ext}`);
		}

		// Set operation input from a source file
		const input = pdfSDK.FileRef.createFromLocalFile(source);
		exportPdfOperation.setInput(input);

		// Execute the operation and Save the result to the specified location.
		exportPdfOperation.execute(executionContext)
		.then(result => result.saveAsFile(output))
		.then(() => resolve())
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