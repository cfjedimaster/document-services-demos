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



// Lame function to add a delay to my polling calls
async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
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

(async () => {


	// specifics for this demo
	let filePath = 'pdf_that_needs_ocr.pdf';
	let mediaType = 'application/pdf';
	let downloadPath = 'pdf_that_is_ocr.pdf';

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
	let uploadData = await getUploadData(mediaType, CLIENT_ID, accessToken);
	console.log(`Upload URI and asset ID (${uploadData.assetID}) received.`);

	//console.log(uploadData.uploadUri);

	/*
	Step 3 - upload our file to the cloud storage provider.
	*/

	console.log(`Sending ${filePath} to cloud provider.`);
	await uploadFile(uploadData.uploadUri, filePath, mediaType);
	console.log('File uploaded to cloud provider.');
	console.log(uploadData);

	/*
	let del = await fetch(uploadData.uploadUri, {
		method:'DELETE', 
		redirect:'follow'
	});
	console.log(del);
	*/
	let req = await fetch(REST_API+'/assets', {
		method:'delete',
		headers: {
			'X-API-Key':CLIENT_ID,
			'Authorization':`Bearer ${accessToken}`,
			'Content-Type':'application/json'
		},
		body: {
			'assetID':uploadData.assetID
		}
	});
	console.log(req);

})();
