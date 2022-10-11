require('dotenv').config({ path: '.sealenv' });
const auth=require("@adobe/jwt-auth");
const fetch = require('node-fetch');
const fs = require('fs');

const CLIENT_ID = process.env.CLIENTID;
const CLIENT_SECRET = process.env.CLIENTSECRET;
const TECHNICAL_ACCOUNT_ID = process.env.TECHNICALACCOUNTID;
const ORG_ID = process.env.ORGID;
const KEY = process.env.KEY;

const TSP = process.env.TSP;
const TSP_ENDPOINT=process.env.TSPENDPOINT;
const TSP_CLIENT_ID = process.env.TSPCLIENTID;
const TSP_CLIENT_SECRET = process.env.TSPCLIENTSECRET;
const TSP_PIN = process.env.TSPPIN;
const TSP_CREDENTIAL_ID = process.env.TSPCREDENTIALID;


/*
Root URL for all REST stuff
*/
const REST_API = "https://pdf-services.adobe.io/";

async function getTSPAcccessToken(tsp_creds) {
	
	let body = { ...tsp_creds};
	delete body["endpoint"];

	body['grant_type'] = 'client_credentials';

	body = JSON.stringify(body);

	let resp = await fetch(tsp_creds.endpoint, 
	{
		method:'POST',
		headers:{
			'Content-Type':'application/json',
			'Accept':'application/json'
		},
		body:body
	});
	
	let result = await resp.json();
	return result.access_token;
}

async function getAccessToken(creds) {
	creds.metaScopes = "https://ims-na1.adobelogin.com/s/ent_documentcloud_sdk";
	creds.ims = "https://ims-na1-stg1.adobelogin.com";

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

async function createSealJob(asset, options, clientId, token) {

	let body = {
		'inputDocumentAssetID':asset,
		sealOptions: { ...options }
	}

	body = JSON.stringify(body);

	let req = await fetch(REST_API+'operation/electronicseal', {
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
		console.log('Polling (last status:', status, ')');
		if(status === 'failed') {
			console.log(res);
			throw new Error('Error working job', { cause:res.error });
		}
		if(status === 'done') {
			location = res.asset.downloadUri;
		}
		else await delay(2000);
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

(async () => {


	// specifics for this demo
	let filePath = 'pdf_that_is_ocr.pdf';
	let mediaType = 'application/pdf';
	let downloadPath = 'pdf_that_is_sealed.pdf';

	/*
	Step one - auth with TSP
	*/
	let tspAccessToken = await getTSPAcccessToken({
		endpoint:TSP_ENDPOINT, 
		client_id:TSP_CLIENT_ID,
		client_secret:TSP_CLIENT_SECRET
	});

	console.log('TSP Access token received.');

	/*
	Step two - get an access token for us
	*/
	let accessToken = await getAccessToken({
		clientId:CLIENT_ID, 
		technicalAccountId:TECHNICAL_ACCOUNT_ID, 
		orgId:ORG_ID, 
		clientSecret:CLIENT_SECRET, 
		privateKey: KEY
	});


	/*
	Step two - get an upload URL/asset id
	*/
	let uploadData = await getUploadData(mediaType, CLIENT_ID, accessToken);
	console.log(`Upload URI and asset ID (${uploadData.assetID}) received.`);


	/*
	Step 3 - upload our file to the cloud storage provider.
	*/

	console.log(`Sending ${filePath} to cloud provider.`);
	await uploadFile(uploadData.uploadUri, filePath, mediaType);
	console.log('File uploaded to cloud provider.');

	/*
	Step 4 - create the Seal job.
	*/
	let seal = {
		"signatureFormat": "PKCS7",
		"cscCredentialOptions": {
			"credentialId": TSP_CREDENTIAL_ID,
			"providerName": TSP,
			"authorizationContext": {
				"tokenType": "bearer",
				"accessToken": tspAccessToken
			},
			"credentialAuthParameters": {
				"pin": TSP_PIN
			}
		},
		"sealFieldOptions": {
			"location": {
				"top": 300,
				"left": 50,
				"right": 250,
				"bottom": 100
			},
			"fieldName": "mytestfield",
			"pageNumber": 1
		},
		"sealAppearanceOptions": {
			"displayOptions": [
				"NAME",
				"DATE",
				"DISTINGUISHED_NAME",
				"LABELS",
				"SEAL_IMAGE"
			]
		}
	}

	let job = await createSealJob(uploadData.assetID, seal, CLIENT_ID, accessToken);
	console.log(`Seal job created, ${job}`);

	console.log('Now beginning poll process.');
	let downloadURL;
	try {
		downloadURL = await pollJob(job, CLIENT_ID, accessToken);
	} catch(e) {
		console.log('Caught error', e.message, e.cause);
		process.exit(1);
	}
	console.log('Poll process complete, download URL retrieved. Let\'s get it!');

	await downloadFile(downloadURL, downloadPath);
	console.log(`Download operation complete. File saved to ${downloadPath}.`);
})();


