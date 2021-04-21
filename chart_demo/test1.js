const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');
const fs = require('fs');
const fetch = require('node-fetch');

(async () => {

	let input = './catreport.docx';
	let data = JSON.parse(fs.readFileSync('./cats.json'));
	let output = './catreport.pdf';

	if(fs.existsSync(output)) fs.unlinkSync(output);

    let url = generateQuickChartURL(data.numberOfCats);
    // get my image 
    data.image = await urlToBase64(url);

	await generateFromTemplate(input, data, output, './pdftools-api-credentials.json');

})();

/*
I'm specifically designed to return a url for a line item chart based on my cat array 
- must include 'date' and 'amount'
*/
function generateQuickChartURL(arr) {
    let labels = arr.map(d => d.date);
    let data = arr.map(d => d.amount);
    
    
    let url = `https://quickchart.io/chart?c={type:'line',data:{labels:${JSON.stringify(labels)},datasets:[{label:'Cats',data:${JSON.stringify(data)}}]}}`;
    console.log(url);
    return url;    
}

async function urlToBase64(url) {
	let resp = await fetch(url);
	let header = resp.headers.get('content-type');
	let body = await resp.arrayBuffer();
	
	data = 'data:' + resp.headers.get('content-type') + ';base64,' + Buffer.from(body).toString('base64');
    return data;
}

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