const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

const inputFile = '/mnt/c/Users/ray/Downloads/email.html';
const output = './html_to_pdf.pdf';

if(fs.existsSync(output)) fs.unlinkSync(output);

const setCustomOptions = (htmlToPDFOperation) => {
	// Define the page layout, in this case an 20 x 25 inch page (effectively portrait orientation).
	const pageLayout = new PDFServicesSdk.CreatePDF.options.html.PageLayout();
//	pageLayout.setPageSize(20, 25);

	// Set the desired HTML-to-PDF conversion options.
	const htmlToPdfOptions = new PDFServicesSdk.CreatePDF.options.html.CreatePDFFromHtmlOptions.Builder()
		.includesHeaderFooter(false)
		.withPageLayout(pageLayout)
		.build();
	htmlToPDFOperation.setOptions(htmlToPdfOptions);
};


try {
   // Initial setup, create credentials instance.
   const credentials =  PDFServicesSdk.Credentials
     .serviceAccountCredentialsBuilder()
     .fromFile("pdftools-api-credentials.json")
     .build();

   // Create an ExecutionContext using credentials and create a new operation instance.
   const executionContext = PDFServicesSdk.ExecutionContext.create(credentials),
     htmlToPDFOperation = PDFServicesSdk.CreatePDF.Operation.createNew();

   // Set operation input from a source file.
   const input = PDFServicesSdk.FileRef.createFromLocalFile(inputFile);
   htmlToPDFOperation.setInput(input);

   // Provide any custom configuration options for the operation.
   setCustomOptions(htmlToPDFOperation);

   // Execute the operation and Save the result to the specified location.
   htmlToPDFOperation.execute(executionContext)
     .then(result => {
		result.saveAsFile(output);
		console.log(`Done and saved to ${output}`);
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