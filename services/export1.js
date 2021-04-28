const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');
const fs = require('fs');

(async ()=> {

	const input = './hamlet.pdf';
	const outputs = [
		'./hamlet.docx', 
		'./hamlet.pptx',
		'./hamlet.rtf'
	];

	for(output of outputs) {
		console.log(`Export ${input} to ${output}`);
		//clean up existing output
		if(fs.existsSync(output)) fs.unlinkSync(output);
		await exportPDF(input, output, './pdftools-api-credentials.json');
	}

})();

async function exportPDF(source, output, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  PDFToolsSdk.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = PDFToolsSdk.ExecutionContext.create(credentials),
				exportPDF = PDFToolsSdk.ExportPDF;

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
		const input = PDFToolsSdk.FileRef.createFromLocalFile(source);
		exportPdfOperation.setInput(input);

		// Execute the operation and Save the result to the specified location.
		exportPdfOperation.execute(executionContext)
		.then(result => result.saveAsFile(output))
		.then(() => resolve())
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