/*
Given a URL, create a PDF
*/

const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

//clean up previous
(async ()=> {

	const input = 'https://www.adobe.com';
	const output = './urltopdf.pdf';
	const creds = './pdftools-api-credentials.json';

	if(fs.existsSync(output)) fs.unlinkSync(output);

	try {
		let result = await urlToPDF(input, output, creds);
		console.log(`Done and saved to ${output}`);
	} catch(e) {
		console.error(e);
	}

})();

async function urlToPDF(url, output, creds) {

    return new Promise(async (resolve, reject) => {

		const setCustomOptions = (htmlToPDFOperation) => {
			// Define the page layout, in this case an 20 x 25 inch page (effectively portrait orientation).
			const pageLayout = new pdfSDK.CreatePDF.options.html.PageLayout();
			pageLayout.setPageSize(20, 25);

			// Set the desired HTML-to-PDF conversion options.
			const htmlToPdfOptions = new pdfSDK.CreatePDF.options.html.CreatePDFFromHtmlOptions.Builder()
				.includesHeaderFooter(true)
				.withPageLayout(pageLayout)
				.build();
				htmlToPDFOperation.setOptions(htmlToPdfOptions);
		};

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		// Create an ExecutionContext using credentials and create a new operation instance.
		const executionContext = pdfSDK.ExecutionContext.create(credentials),
		htmlToPDFOperation = pdfSDK.CreatePDF.Operation.createNew();

		// Set operation input from a source file.
		const input = pdfSDK.FileRef.createFromURL(url);
		htmlToPDFOperation.setInput(input);

		// Provide any custom configuration options for the operation.
		setCustomOptions(htmlToPDFOperation);

		// Execute the operation and Save the result to the specified location.
		try {
			let result = await htmlToPDFOperation.execute(executionContext);
			await result.saveAsFile(output);
			resolve(true);
		} catch(err) { 
			if(err instanceof pdfSDK.Error.ServiceApiError
				|| err instanceof pdfSDK.Error.ServiceUsageError) {
				console.log('in first catch');
				reject(err);
			} else {
				reject( err);
			}
		};

	});
}
