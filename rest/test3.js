require('dotenv').config();
const ServicesWrapper = require('./ServicesWrapper');

const creds = {
	clientId: process.env.CLIENTID,
	clientSecret: process.env.CLIENTSECRET,
	technicalAccountId: process.env.TECHNICALACCOUNTID,
	orgId: process.env.ORGID, 
	privateKey: process.env.KEY
}

let filePath = 'pdf_that_needs_ocr.pdf';
let mediaType = 'application/pdf';
let downloadPath = 'pdf_that_is_ocr_and_compressed.pdf';

let sw = new ServicesWrapper(creds);

(async () => {


	let asset = await sw.upload(filePath, mediaType);
	console.log('PDF uploaded');

	let job = await sw.createOCRJob(asset);

	await sw.pollJob(job);
	console.log('OCR is done, now compressing');

	let job2 = await sw.createCompressJob(asset);

	await sw.downloadWhenDone(job2, downloadPath);
	console.log(`File saved to ${downloadPath}`);

})();

