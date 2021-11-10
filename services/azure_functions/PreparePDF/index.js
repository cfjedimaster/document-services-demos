const { Readable } = require('stream');
const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const nanoid = require('nanoid').nanoid;

const creds = './pdftools-api-credentials.json';

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let body = context.req.body;
    fs.writeFileSync('./pureb64.txt', body);
    body = body.replace('data:application/pdf;base64,','');
    let binaryData = Buffer.from(body, 'base64');

	let output = '/tmp/' + nanoid() + '.pdf';
	fs.writeFileSync(output, binaryData);
    
    let ref = pdfSDK.FileRef.createFromLocalFile(output);
     
    let properties = await getPDFProperties(ref, creds);
    context.log('got props');


    if(needsOCR(properties)) {
      context.log('this PDF needs to be OCRed');
      ref = await ocrPDF(ref, creds, context);
      context.log('ok i made it ocr now');
    } 

    // now optimize
    ref = await compressPDF('./pdf_that_is_now_ocr.pdf', creds, context);

    const resp = 1;

    context.res = {
        body: JSON.stringify(resp), 
        headers: {
            'Content-Type':'application/json'
        }
    };
}

/*
Given the result of a PDF props call, I look at the pages array and return true if ANY need OCR
*/
function needsOCR(data) {
  for(let i=0; i<data.pages.length; i++) {  
//  if(data.pages[i].is_scanned === true) return true;
  }
  return false;
}

async function getPDFProperties(source, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
			pdfOperation = pdfSDK.PDFProperties.Operation.createNew();

		// Set operation input from a source file
        let input;
        if(typeof source === 'object') input = source;
        else input = pdfSDK.FileRef.createFromLocalFile(source);
		
        pdfOperation.setInput(input);

		// Provide any custom configuration options for the operation.
		const options = new pdfSDK.PDFProperties.options.PDFPropertiesOptions.Builder()
		.includePageLevelProperties(true)
		.build();
		pdfOperation.setOptions(options);

		pdfOperation.execute(executionContext)
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

async function ocrPDF(source, creds, context) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
				ocrOperation = pdfSDK.OCR.Operation.createNew();

		// Set operation input from a source file
        let input;
        if(typeof source === 'object') input = source;
        else input = pdfSDK.FileRef.createFromLocalFile(source);

		ocrOperation.setInput(input);
        context.log('about to actually do the ocr');
		// Execute the operation and Save the result to the specified location.
		ocrOperation.execute(executionContext)
		.then(result => resolve(result))
		.catch(err => {
			if(err instanceof pdfSDK.Error.ServiceApiError
			|| err instanceof pdfSDK.Error.ServiceUsageError) {
                context.log('did i come in the first error');
				reject(err);
			} else {
                context.log('did i come in the second error');
				reject(err);
			}
		});

	});
}

async function compressPDF(source, creds, context) {

    return new Promise(async (resolve, reject) => {
   		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

        const executionContext = pdfSDK.ExecutionContext.create(credentials),
        compressPDF = pdfSDK.CompressPDF,
        compressPDFOperation = compressPDF.Operation.createNew();

        // Set operation input from a source file
        let input;
        if(typeof source === 'object') input = source;
        else input = pdfSDK.FileRef.createFromLocalFile(source);
        compressPDFOperation.setInput(input);

        // Provide any custom configuration options for the operation.
        const options = new compressPDF.options.CompressPDFOptions.Builder()
        .withCompressionLevel(pdfSDK.CompressPDF.options.CompressionLevel.MEDIUM)
        .build();
        
        compressPDFOperation.setOptions(options);

        compressPDFOperation.execute(executionContext)
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