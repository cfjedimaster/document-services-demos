require('dotenv').config();
const auth=require("@adobe/jwt-auth");
const fetch = require('node-fetch');
const fs = require('fs');

const CLIENT_ID = process.env.CLIENTID;
const CLIENT_SECRET = process.env.CLIENTSECRET;
const TECHNICAL_ACCOUNT_ID = process.env.TECHNICALACCOUNTID;
const ORG_ID = process.env.ORGID;
const KEY = process.env.KEY;

const REST_API = "https://pdf-services.adobe.io/";

(async ()=> {

	let inputPDF = process.argv[2];

	if(!inputPDF) {
		console.error('Syntax: properties.js <input pdf doc> ');
		process.exit(1);
	}

	/*
	Step one - get an access token
	*/
	let accessToken = await getAccessToken({
		clientId:CLIENT_ID, 
		technicalAccountId:TECHNICAL_ACCOUNT_ID, 
		orgId:ORG_ID, 
		clientSecret:CLIENT_SECRET, 
		privateKey: KEY
	});
	console.log('Access token received.');

	/*
	Step two - get an upload URL/asset id
	*/
	let uploadData = await getUploadData('application/pdf', CLIENT_ID, accessToken);
	console.log(`Upload URI and asset ID (${uploadData.assetID}) received.`);

	/*
	Step 3 - upload our file to the cloud storage provider.
	*/
	console.log(`Sending ${inputPDF} to cloud provider.`);
	await uploadFile(uploadData.uploadUri, inputPDF, 'application/pdf');
	console.log('File uploaded to cloud provider.');

	/*
	Step 4 - create the OCR job.
	*/
	let job = await createPropertiesJob(uploadData.assetID, CLIENT_ID, accessToken);
	console.log(`Properties job created, ${job}`);

	console.log('Now beginning poll process.');
	let result = await pollJob(job, CLIENT_ID, accessToken);
	//console.log(result);
	fs.writeFileSync('./properties_test_output.json', JSON.stringify(result), 'utf8');
	console.log('done');



})();

async function getAccessToken(creds) {
	/*
	These values are hard coded for now - I believe ims can go away
	once we're in production, not sure about metaScopes
	*/
	creds.metaScopes = "https://ims-na1.adobelogin.com/s/ent_documentcloud_sdk";

	let result = await auth(creds);
	return result.access_token;
}

async function getUploadData(mediaType, clientId, token) {

	let body = {
		'mediaType': mediaType
	};
	body = JSON.stringify(body);

	let req = await fetch(REST_API+'/assets', {
		method:'post',
		headers: {
			'X-API-Key':clientId,
			'Authorization':`Bearer ${token}`,
			'Content-Type':'application/json'
		},
		body: body
	});

	let data = await req.json();
	return data;
}

async function uploadFile(url, filePath, mediaType) {

	let stream = fs.createReadStream(filePath);
	let stats = fs.statSync(filePath);
	let fileSizeInBytes = stats.size;

	let upload = await fetch(url, {
		method:'PUT', 
		redirect:'follow',
		headers: {
			'Content-Type':mediaType, 
			'Content-Length':fileSizeInBytes
		},
		body:stream
	});

	if(upload.status === 200) return;
	else {
		throw('Bad result, handle later.');
	}

}

async function createPropertiesJob(asset, clientId, token) {

	let body = {
		'assetID': asset ,
		'pageLevel':true
	};
	body = JSON.stringify(body);

	let req = await fetch(REST_API+'operation/pdfproperties', {
		method:'post',
		headers: {
			'X-API-Key':clientId,
			'Authorization':`Bearer ${token}`,
			'Content-Type':'application/json'
		},
		body: body
	});

	return req.headers.get('location');
}

// Lame function to add a delay to my polling calls
async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

async function pollJob(url, clientId, token) {

	let status = null;

	while(status !== 'done') {
		let req = await fetch(url, {
			method:'GET',
			headers: {
				'X-API-Key':clientId,
				'Authorization':`Bearer ${token}`,
			}
		});

		let res = await req.json();
		status = res.status;
		console.log('Polling...');
		if(status === 'done') return res;
		else await delay(2000);
	}

}
