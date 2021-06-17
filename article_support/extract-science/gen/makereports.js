/*
I'm responsible for using Document Generation to create one PDF per year.
My input, records.json, is an array where each element has a year and months array.
So I basically need one PDF per top level record

This code does NOT really do the loop well - or maybe it does - screw it - I'm just
trying to generate seed data for extract. 
*/
const fs = require('fs');
const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');

const data = require('./records.json');
const input = './report.docx';

data.map(async yearRecord => {
	console.log(`Lets work with year ${yearRecord.year}`);
	let fileName = `${yearRecord.year}.pdf`;
	if(fs.existsSync(fileName)) fs.unlinkSync(fileName);

	//Lets make a data structure for document generation
	let myData = {
		year:yearRecord.year, 
		months:yearRecord.months
	}

	//console.log(myData);
	await generateFromTemplate(input, myData, fileName, './pdftools-api-credentials.json');
	console.log(`Done making ${fileName}`); 
});
// 23.964697371008768

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
        let destExt = dest.split('.').pop().toLowerCase();
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