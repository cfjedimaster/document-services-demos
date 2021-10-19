const PDFToolsSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const slug = require('slug')
const threewords = require('threewords');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//email address I'll be sending from
const FROM = 'raymondcamden@gmail.com';

let input = './invoice.docx';
let data = './data.json';

if(!fs.existsSync(data)) {
	console.error(`Can't find data file ${data}`);
	process.exit(1);
} else data = JSON.parse(fs.readFileSync(data,'utf8'));

(async () => {

	for(d of data) {
		console.log(`Generating invoice for ${d.company.name} ...`);
		// output needs to have a unique filename, we can make this based on company name
		let output = slug(d.company.name) + '.pdf';

		if(fs.existsSync(output)) {
			console.log(`Output destination (${output}) exists - deleting.`);
			fs.unlinkSync(output);
		}

		await generateFromTemplate(input, d, output, './pdftools-api-credentials.json');
		console.log(`Invoice generated: ${output}.`);

		//generate a password
		let password = threewords.random();
		console.log(`Will assign password ${password}.`);

		//generate a new filename
		let output_protected = output.replace('.pdf', '-protected.pdf');
		if(fs.existsSync(output_protected)) {
			console.log(`Output destination (${output_protected}) exists - deleting.`);
			fs.unlinkSync(output_protected);
		}

		await passwordProtectPDF(output, password, output_protected, './pdftools-api-credentials.json');
		console.log(`New protected PDF saved to ${output_protected}.`);

		//send the email
		let mail = `
Dear ${d.company.name}:

Your invoice is attached. You can open it with the password: ${password}

Have a nice day.
`;

		await sendMail(d.company.email, FROM, 'Invoice', mail, output_protected);
		console.log(`Mail sent to ${d.company.email}.`);

	};

})();

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

async function passwordProtectPDF(inputPDF, password, dest, creds) {

    return new Promise((resolve, reject) => {

        // Initial setup, create credentials instance.
        const credentials =  PDFToolsSdk.Credentials
        .serviceAccountCredentialsBuilder()
        .fromFile(creds)
        .build();

        // Create an ExecutionContext using credentials.
        const executionContext = PDFToolsSdk.ExecutionContext.create(credentials);

		// Build ProtectPDF options by setting a User Password and Encryption
		// Algorithm (used for encrypting the PDF file).
		const protectPDF = PDFToolsSdk.ProtectPDF,
			options = new protectPDF.options.PasswordProtectOptions.Builder()
			.setUserPassword(password)
			.setEncryptionAlgorithm(PDFToolsSdk.ProtectPDF.options.EncryptionAlgorithm.AES_256)
			.build();

		// Create a new operation instance.
		const protectPDFOperation = protectPDF.Operation.createNew(options);

		const input = PDFToolsSdk.FileRef.createFromLocalFile(inputPDF);
		protectPDFOperation.setInput(input);
        
		// Execute the operation and Save the result to the specified location.
        protectPDFOperation.execute(executionContext)
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

async function sendMail(to, from, subject, text, attachment) {
	let pdfInBase64 = (fs.readFileSync(attachment)).toString('base64');
	const msg = {
		to, 
		from,
		subject, 
		text, 
		attachments: [
			{
			content: pdfInBase64, 
			filename: attachment,
			type:'application/pdf'
			}
		]
	}

	return new Promise(async (resolve, reject) => {
		try {
			await sgMail.send(msg);
			resolve(true);
		} catch (error) {
			console.error(error);

			if (error.response) {
				console.error(error.response.body)
			}

			reject(error);
		}
	});

}