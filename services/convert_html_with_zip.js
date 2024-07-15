/*
I need a script to test the zip to PDF stuff. This script will automatically zip a folder for me, and using
the SDK, pass it on.
*/

require('dotenv').config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;


const {
	ServicePrincipalCredentials,
	PDFServices,
	MimeType,
	PageLayout,
	HTMLToPDFParams, 
	HTMLToPDFJob, 
	HTMLToPDFResult
} = require("@adobe/pdfservices-node-sdk");

const AdmZip = require('adm-zip');
const fs = require('fs');

//remove previous test
if(fs.existsSync('output/createPdfFromDynamicHtmlOutput.pdf')) fs.unlinkSync('output/createPdfFromDynamicHtmlOutput.pdf');

let inputDir = './inputhtml';

// First, zip up my input
let zip = new AdmZip();
zip.addLocalFolder(inputDir);
zip.writeZip('./temp.zip');

function getHTMLToPDFParams() {
    // Define the page layout, in this case an 8 x 11.5 inch page (effectively portrait orientation)
    const pageLayout = new PageLayout({
        pageHeight: 11.5,
        pageWidth: 8
    });

    // Set the dataToMerge field that needs to be populated in the HTML before its conversion
    const dataToMerge = {
        "title": "Create, Convert PDFs and More!",
        "sub_title": "Easily integrate PDF actions within your document workflows."
    };

    return new HTMLToPDFParams({
        pageLayout,
        dataToMerge,
        includeHeaderFooter: true,
    });
}

(async () => {

	try {
		// Initial setup, create credentials instance.
		const credentials = new ServicePrincipalCredentials({
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET
		});

		const pdfServices = new PDFServices({credentials});

		let readStream = fs.createReadStream("./temp.zip");
		const inputAsset = await pdfServices.upload({
			readStream,
			mimeType: MimeType.ZIP
		});

		const params = new getHTMLToPDFParams();
		const job = new HTMLToPDFJob({inputAsset, params });

		const pollingURL = await pdfServices.submit({job});
        const pdfServicesResponse = await pdfServices.getJobResult({
            pollingURL,
            resultType: HTMLToPDFResult
        });


		const resultAsset = pdfServicesResponse.result.asset;
        const streamAsset = await pdfServices.getContent({asset: resultAsset});

        // Creates an output stream and copy result asset's content to it
        const outputFilePath = 'output/createPdfFromDynamicHtmlOutput.pdf';

        console.log(`Saving asset at ${outputFilePath}`);

		const outputStream = fs.createWriteStream(outputFilePath);
        streamAsset.readStream.pipe(outputStream);
		
		fs.unlinkSync('./temp.zip');

		console.log('Done');
	
	} catch (err) {
	console.log('Exception encountered while executing operation', err);
	}

})();