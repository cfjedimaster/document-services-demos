const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

const inputFile = './html2.zip';
const output = './html_to_pdf2.pdf';

if(fs.existsSync(output)) fs.unlinkSync(output);

const setCustomOptions = (htmlToPDFOperation, data) => {
	const pageLayout = new PDFServicesSdk.CreatePDF.options.html.PageLayout();

	// Set the desired HTML-to-PDF conversion options.
	const htmlToPdfOptions = new PDFServicesSdk.CreatePDF.options.html.CreatePDFFromHtmlOptions.Builder()
		.includesHeaderFooter(false)
		.withPageLayout(pageLayout)
		.withDataToMerge(data)
		.build();
	htmlToPDFOperation.setOptions(htmlToPdfOptions);
};


try {
   // Initial setup, create credentials instance.
   const credentials =  PDFServicesSdk.Credentials
     .serviceAccountCredentialsBuilder()
     .fromFile("pdfservices-api-credentials.json")
     .build();

   // Create an ExecutionContext using credentials and create a new operation instance.
   const executionContext = PDFServicesSdk.ExecutionContext.create(credentials),
     htmlToPDFOperation = PDFServicesSdk.CreatePDF.Operation.createNew();

   // Set operation input from a source file.
   const input = PDFServicesSdk.FileRef.createFromLocalFile(inputFile);
   htmlToPDFOperation.setInput(input);

	let data = fs.readFileSync('./htmldata.json','utf8');
   // Provide any custom configuration options for the operation.
   setCustomOptions(htmlToPDFOperation, data);

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