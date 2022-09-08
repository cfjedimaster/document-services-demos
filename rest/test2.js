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
let downloadPath = 'pdf_that_is_ocr2.pdf';

let sw = new ServicesWrapper(creds);

(async () => {


	let asset = await sw.upload(filePath, mediaType);
	console.log('result', asset);

	let job = await sw.createOCRJob(asset);
	console.log('job', job);

	await sw.downloadWhenDone(job, downloadPath);
	console.log(`File saved to ${downloadPath}`);

})();

