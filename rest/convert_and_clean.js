require('dotenv').config();
const auth=require("@adobe/jwt-auth");
const fetch = require('node-fetch');
const fs = require('fs');

const CLIENT_ID = process.env.CLIENTID;
const CLIENT_SECRET = process.env.CLIENTSECRET;
const TECHNICAL_ACCOUNT_ID = process.env.TECHNICALACCOUNTID;
const ORG_ID = process.env.ORGID;
const KEY = process.env.KEY;

/*
Root URL for all REST stuff
*/
const REST_API = "https://pdf-services.adobe.io/";


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

async function createPDFJob(asset, clientId, token) {

	let body = {
		'assetID': asset 
	};
	body = JSON.stringify(body);

	let req = await fetch(REST_API+'operation/createpdf', {
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
	let location; 

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
		if(status === 'done') location = res.asset;
		else await delay(3000);
	}

	return location;
}

async function downloadFile(url, filePath) {
	let res = await fetch(url);
	let stream = fs.createWriteStream(filePath);
	await new Promise((resolve, reject) => {
		res.body.pipe(stream);
		res.body.on('error', reject);
		stream.on('finish', resolve);
	});
	return;
}

async function getAsset(id, clientId, token) {
	let req = await fetch(REST_API+`assets/${id}`, {
		method:'GET',
		headers: {
			'X-API-Key':clientId,
			'Authorization':`Bearer ${token}`,
		}
	});
	return await req.json();
}

async function deleteAsset(id, clientId, token) {
	let req = await fetch(REST_API+`assets/${id}`, {
		method:'DELETE',
		headers: {
			'X-API-Key':clientId,
			'Authorization':`Bearer ${token}`,
		}
	});
	return req.status;
}

(async () => {

	let DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

	let accessToken = await getAccessToken({
		clientId:CLIENT_ID, 
		technicalAccountId:TECHNICAL_ACCOUNT_ID, 
		orgId:ORG_ID, 
		clientSecret:CLIENT_SECRET, 
		privateKey: KEY
	});

	// Step 1 - Upload a Word doc for converting. Begin by making the asset
	let asset = await getUploadData(DOCX, CLIENT_ID, accessToken);
	console.log(`Word doc asset created, ID is ${asset.assetID}`);

	// Step 2- upload the bits
	await uploadFile(asset.uploadUri, './sample.docx', DOCX);
	console.log('Done uploading bits.');

	// Start a job to convert to PDF
	let jobURL = await createPDFJob(asset.assetID, CLIENT_ID, accessToken);
	console.log(`URL for the job: ${jobURL}`);

	// Poll job to see if done.
	let resultAsset = await pollJob(jobURL, CLIENT_ID, accessToken);
	console.log(`Job is done. It has an asset ID of ${resultAsset.assetID}`);

	await downloadFile(resultAsset.downloadUri, './result.pdf');
	console.log('Result saved to - wait for it - result.pdf');

	console.log('\n\nCLEAN TIME!!!!!!!!!');

	console.log(`First, we will confirm we can GET the uploaded Word doc still: ${asset.assetID}`);
	let res = await getAsset(asset.assetID, CLIENT_ID, accessToken);
	let download = res.downloadUri;
	console.log(`We got it, and it can be downloaded at ${download}\n`);
	console.log('Now we will call delete...');
	
	await deleteAsset(asset.assetID, CLIENT_ID, accessToken);
	console.log(`Confirm deleted by trying to load this: ${download}\n.`);

	console.log('Now we will call delete on the result asset.');
	await deleteAsset(resultAsset.assetID, CLIENT_ID, accessToken);
	console.log(`Done, confirm by trying to download ${resultAsset.downloadUri}`);



})();