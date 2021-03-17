const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');
const fs = require('fs');

const outputFile = './docOutput.docx';

//remove output if exists
if(fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

// Initial setup, create credentials instance.
const credentials =  PDFToolsSdk.Credentials
      .serviceAccountCredentialsBuilder()
      .fromFile("pdftools-api-credentials.json")
      .build();

const data = {
    customerName:"Kane Miuller",
    customerVisits: 100
};

// Create an ExecutionContext using credentials.
const executionContext = PDFToolsSdk.ExecutionContext.create(credentials);

// Create a new DocumentMerge options instance.
const documentMerge = PDFToolsSdk.DocumentMerge,
      documentMergeOptions = documentMerge.options,
      options = new documentMergeOptions.DocumentMergeOptions(data, documentMergeOptions.OutputFormat.DOCX);

// Create a new operation instance using the options instance.
const documentMergeOperation = documentMerge.Operation.createNew(options);

// Set operation input document template from a source file.
const input = PDFToolsSdk.FileRef.createFromLocalFile('docTemplate.docx');
documentMergeOperation.setInput(input);

// Execute the operation and Save the result to the specified location.
documentMergeOperation.execute(executionContext)
.then(result => result.saveAsFile(outputFile))
.catch(err => {
    if(err instanceof PDFToolsSdk.Error.ServiceApiError
        || err instanceof PDFToolsSdk.Error.ServiceUsageError) {
        console.log('Exception encountered while executing operation', err);
    } else {
        console.log('Exception encountered while executing operation', err);
    }
});