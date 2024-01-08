/*
I need a script to test the zip to PDF stuff. This script will automatically zip a folder for me, and using
the SDK, pass it on.
*/

require('dotenv').config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const AdmZip = require('adm-zip');
const fs = require('fs');

//remove previous test
if(fs.existsSync('output/createPdfFromDynamicHtmlOutput.pdf')) fs.unlinkSync('output/createPdfFromDynamicHtmlOutput.pdf');

let inputDir = './inputhtml';

// First, zip up my input
let zip = new AdmZip();
zip.addLocalFolder(inputDir);
zip.writeZip('./temp.zip');

const setCustomOptions = (htmlToPDFOperation) => {
	// Define the page layout, in this case an 8 x 11.5 inch page (effectively portrait orientation).
	const pageLayout = new PDFServicesSdk.CreatePDF.options.html.PageLayout();
	pageLayout.setPageSize(8, 11.5);
	//Set the dataToMerge field that needs to be populated in the HTML before its conversion.
	const dataToMerge = {
		"title":"Create, Convert PDFs and More!",
		"sub_title": "Easily integrate PDF actions within your document workflows."
	};
	// Set the desired HTML-to-PDF conversion options.
	const htmlToPdfOptions = new PDFServicesSdk.CreatePDF.options.html.CreatePDFFromHtmlOptions.Builder()
		.includesHeaderFooter(true)
		.withPageLayout(pageLayout)
		.withDataToMerge(dataToMerge)
		.build();
	htmlToPDFOperation.setOptions(htmlToPdfOptions);
};


try {
	// Initial setup, create credentials instance.
	const credentials =  PDFServicesSdk.Credentials
		.servicePrincipalCredentialsBuilder()
		.withClientId(CLIENT_ID)
		.withClientSecret(CLIENT_SECRET)
		.build();

	const clientConfig = PDFServicesSdk.ClientConfig
		.clientConfigBuilder()
		.withConnectTimeout(15000)
		.withReadTimeout(15000)
		.withProcessingTimeout(1200000)
	.build();

	// Create an ExecutionContext using credentials and create a new operation instance.
	const executionContext = PDFServicesSdk.ExecutionContext.create(credentials, clientConfig), htmlToPDFOperation = PDFServicesSdk.CreatePDF.Operation.createNew();

	// Set operation input from a source file.
	const input = PDFServicesSdk.FileRef.createFromLocalFile('./temp.zip');
	htmlToPDFOperation.setInput(input);

	// Provide any custom configuration options for the operation.
	setCustomOptions(htmlToPDFOperation);

	// Execute the operation and Save the result to the specified location.
	htmlToPDFOperation.execute(executionContext)
		.then(result => result.saveAsFile('output/createPdfFromDynamicHtmlOutput.pdf'))
		.then(() => {
			// clean up after myself
			fs.unlinkSync('./temp.zip');
		})
		.catch(err => {
			if(err instanceof PDFServicesSdk.Error.ServiceApiError
				|| err instanceof PDFServicesSdk.Error.ServiceUsageError) {
				console.log('Exception encountered while executing operation', err);
			} else {
				console.log('Exception encountered while executing operation', err);
			}
		});
} catch (err) {
console.log('Exception encountered while executing operation', err);
}
