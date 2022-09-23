require('dotenv').config();
const ServicesWrapper = require('./ServicesWrapper');

const creds = {
	clientId: process.env.CLIENTID,
	clientSecret: process.env.CLIENTSECRET,
	technicalAccountId: process.env.TECHNICALACCOUNTID,
	orgId: process.env.ORGID, 
	privateKey: process.env.KEY
}

let filePath = 'input.docx';
let mediaType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

let data = [
	{ "name":"Ray", "company": "Adobe", "class":"barbarian" },
	{ "name":"Lindy", "company": "Blizzard", "class":"mage" }
]
let sw = new ServicesWrapper(creds);

(async () => {


	let asset = await sw.upload(filePath, mediaType);

	for(let i=0; i<data.length; i++) {
		let resultPath = 'dynamicpdf_'+i+'.pdf';
		let job = await sw.createDocumentGenerationJob(asset, 'pdf', data[i]); 
		await sw.downloadWhenDone(job, resultPath);
	}


})();

