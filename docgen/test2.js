const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');
const fs = require('fs');


(async () => {

    const inputFile = './docTemplate.docx';
    let outputFile = './docOutput.docx';
    
    //remove output if exists
    if(fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    
    const data = {
        customerName:"Raymond Camden",
        customerVisits: 199, 
        cats: [
            {name:"Luna", gender: "female", breed: "something", weight: 4},
            {name:"Pig", gender: "female", breed: "something else", weight: 8},
            {name:"Cracker", gender: "male", breed: "large", weight: 10},
        ]
    };
    
    console.log('Creating a Word doc from a Word doc');
    await generateFromTemplate(inputFile, data, outputFile, './pdftools-api-credentials.json');

    outputFile = './docOutput.pdf';
    if(fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    console.log('Creating a PDF doc from a Word doc');
    await generateFromTemplate(inputFile, data, outputFile, './pdftools-api-credentials.json');

})();

/*


*/

/*
Utility function to wrap generating a Word doc from a template, data, and creds
*/
async function generateFromTemplate(template, data, dest, creds) {
    return new Promise((resolve, reject) => {

        // Initial setup, create credentials instance.
        const credentials =  PDFToolsSdk.Credentials
        .serviceAccountCredentialsBuilder()
        .fromFile(creds)
        .build();

        // Create an ExecutionContext using credentials.
        const executionContext = PDFToolsSdk.ExecutionContext.create(credentials);

        const documentMerge = PDFToolsSdk.DocumentMerge,
        documentMergeOptions = documentMerge.options;

        //dest determines if Word or PDF
        let format;
        let destExt = dest.split('.').pop();
        if(destExt === 'docx') format = documentMergeOptions.OutputFormat.DOCX;
        else if(destExt === 'pdf') format = documentMergeOptions.OutputFormat.PDF;
        else throw('Invalid destination extension')

        // Create a new DocumentMerge options instance.
        options = new documentMergeOptions.DocumentMergeOptions(data, format);

        // Create a new operation instance using the options instance.
        const documentMergeOperation = documentMerge.Operation.createNew(options);

        // Set operation input document template from a source file.
        const input = PDFToolsSdk.FileRef.createFromLocalFile(template);
        documentMergeOperation.setInput(input);

        // Execute the operation and Save the result to the specified location.
        documentMergeOperation.execute(executionContext)
        .then(result => result.saveAsFile(dest))
        .then(() => resolve(true))
        .catch(err => {
            if(err instanceof PDFToolsSdk.Error.ServiceApiError
                || err instanceof PDFToolsSdk.Error.ServiceUsageError) {
                console.log('Exception encountered while executing operation', err);
                reject(err);
            } else {
                console.log('Exception encountered while executing operation', err);
                reject(err);
            }
        });

    });

}
