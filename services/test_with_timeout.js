/*
I'm testing clientConfig timeout stuff.
*/
const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

(async ()=> {

	const input = './hamlet.pdf';
	const output = './friday.png';

	if(fs.existsSync(output)) fs.unlinkSync(output);
	await exportPDF(input, output, './pdftools-api-credentials.json');
	

})();

async function exportPDF(source, output, creds) {

    return new Promise((resolve, reject) => {

		let ext = output.split('.').pop();

		const credentials =  pdfSDK.Credentials
			.serviceAccountCredentialsBuilder()
			.fromFile(creds)
			.build();

		// testing timeout here
		
		config = pdfSDK.ClientConfig.clientConfigBuilder().withConnectTimeout(1).build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials, config),
				exportPDF = pdfSDK.ExportPDF;

		let exportPdfOperation;

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