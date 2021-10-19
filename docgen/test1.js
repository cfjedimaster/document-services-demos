const PDFToolsSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');

const templateFile = './docTemplate.docx';
const outputFile = './docOutput.pdf';

//remove output if exists
if(fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

// Initial setup, create credentials instance.
const credentials =  PDFToolsSdk.Credentials
      .serviceAccountCredentialsBuilder()
      .fromFile("pdftools-api-credentials.json")
      .build();

const data = {
    customerName:"Kane Miuller",
    customerVisits: 100,
    cats:[
        {"name":"Luna", "gender": "female", "breed": "something", "weight": 4},
        {"name":"Pig", "gender": "female", "breed": "something else", "weight": 8},
        {"name":"Cracker", "gender": "male", "breed": "large", "weight": 10}
    ]
};

// Create an ExecutionContext using credentials.
const executionContext = PDFToolsSdk.ExecutionContext.create(credentials);

// Create a new DocumentMerge options instance.
const documentMerge = PDFToolsSdk.DocumentMerge,
      documentMergeOptions = documentMerge.options,
      options = new documentMergeOptions.DocumentMergeOptions(data, documentMergeOptions.OutputFormat.PDF);

// Create a new operation instance using the options instance.
const documentMergeOperation = documentMerge.Operation.createNew(options);

// Set operation input document template from a source file.
const input = PDFToolsSdk.FileRef.createFromLocalFile(templateFile);
documentMergeOperation.setInput(input);

// Execute the operation and Save the result to the specified location.
documentMergeOperation.execute(executionContext)
.then(result => result.saveAsFile(outputFile))
.then(() => console.log('All done'))
.catch(err => {
    if(err instanceof PDFToolsSdk.Error.ServiceApiError
        || err instanceof PDFToolsSdk.Error.ServiceUsageError) {
        console.log('Exception encountered while executing operation', err);
    } else {
        console.log('Exception encountered while executing operation', err);
    }
});