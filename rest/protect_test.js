require('dotenv').config();
const ServicesWrapper = require('./ServicesWrapper');

const creds = {
	clientId: process.env.CLIENTID,
	clientSecret: process.env.CLIENTSECRET,
	technicalAccountId: process.env.TECHNICALACCOUNTID,
	orgId: process.env.ORGID, 
	privateKey: process.env.KEY
}

let filePath = 'pdf_that_is_ocr.pdf';
let mediaType = 'application/pdf';
let downloadPath = 'pdf_that_is_protected.pdf';

let sw = new ServicesWrapper(creds);

(async () => {


	let asset = await sw.upload(filePath, mediaType);
	console.log('result', asset);

	let job = await sw.createProtectJob(asset, { ownerPassword: 'password' }, 'AES_256', 'ALL_CONTENT', ['PRINT_HIGH_QUALITY']);
	console.log('job', job);

	await sw.downloadWhenDone(job, downloadPath);
	console.log(`File saved to ${downloadPath}`);

})();

