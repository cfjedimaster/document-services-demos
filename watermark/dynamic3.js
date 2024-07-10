import fs from 'fs';

import { Readable } from 'stream';
import { finished } from 'stream/promises';

let REST_API = "https://pdf-services.adobe.io/";

let CLIENT_ID = process.env.CLIENT_ID;
let CLIENT_SECRET = process.env.CLIENT_SECRET;

const TSP = process.env.TSP;
const TSP_ENDPOINT=process.env.TSPENDPOINT;
const TSP_CLIENT_ID = process.env.TSPCLIENTID;
const TSP_CLIENT_SECRET = process.env.TSPCLIENTSECRET;
const TSP_PIN = process.env.TSPPIN;
const TSP_CREDENTIAL_ID = process.env.TSPCREDENTIALID;

let SOURCE_PDF = './adobe_security.pdf';
let WATERMARK_DOC = './source2.docx';

/*
This is hard coded, but in a real application would be dynamic:
*/
let email = 'jedimaster@adobe.com';

/*
Quickly generate a nice time stamp
*/
let timestamp = new Intl.DateTimeFormat('en',{dateStyle:'medium', timeStyle:'long'}).format(new Date());

async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

async function getAccessToken(id, secret) {

	const params = new URLSearchParams();
	params.append('client_id', id);
	params.append('client_secret', secret);

	let resp = await fetch('https://pdf-services-ue1.adobe.io/token', { 
		method: 'POST', 
		headers: {
			'Content-Type':'application/x-www-form-urlencoded'
		},
		body:params 
	});
	let data = await resp.json();
	return data.access_token;
}

async function getUploadData(mediaType, token, clientId) {

	let body = {
		'mediaType': mediaType
	};
	body = JSON.stringify(body);

	let req = await fetch(REST_API+'assets', {
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
		duplex:'half',
		body:stream
	});

	if(upload.status === 200) return;
	else {
		console.log(upload);
		throw('Bad result, handle later.');
	}

}

async function pollJob(url, token, clientId) {

	let status = null;
	let asset; 

	while(status !== 'done') {
		let req = await fetch(url, {
			method:'GET',
			headers: {
				'X-API-Key':clientId,
				'Authorization':`Bearer ${token}`,
			}
		});

		let res = await req.json();
console.log('POLLJOB', res);
		status = res.status;
		if(status === 'done') {
			asset = res;
		} else {
			await delay(2000);
		}
	}

	return asset;
}

async function downloadFile(url, filePath) {
	let res = await fetch(url);
	const body = Readable.fromWeb(res.body);
	const download_write_stream = fs.createWriteStream(filePath);
	return await finished(body.pipe(download_write_stream));
}

async function documentGenerationJob(asset, outputFormat, data, token, clientId) {

	let body = {
		'assetID': asset.assetID,
		'outputFormat': outputFormat, 
		'jsonDataForMerge':data
	};


	let resp = await fetch(REST_API + 'operation/documentgeneration', {
		method: 'POST', 
		headers: {
			'Authorization':`Bearer ${token}`, 
			'X-API-KEY':clientId,
			'Content-Type':'application/json'
		},
		body:JSON.stringify(body)
	});

	return resp.headers.get('location');

}

async function watermarkJob(source, watermark, token, clientId) {
	let body = {
		'inputDocumentAssetID': source.assetID,
		'watermarkDocumentAssetID': watermark.assetID,
		'appearance': {
			'opacity':33
		}
	}

	let resp = await fetch(REST_API + 'operation/addwatermark', {
		method: 'POST', 
		headers: {
			'Authorization':`Bearer ${token}`, 
			'X-API-KEY':clientId,
			'Content-Type':'application/json'
		},
		body:JSON.stringify(body)
	});

	return resp.headers.get('location');

}

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

async function sealJob(asset, options, token, clientId) {

	let body = {
		'inputDocumentAssetID':asset.assetID,
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

(async () => {

	let accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
	console.log('Got our access token.');

	let docGenAsset = await getUploadData('application/vnd.openxmlformats-officedocument.wordprocessingml.document', accessToken, CLIENT_ID);
	await uploadFile(docGenAsset.uploadUri, WATERMARK_DOC,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
	console.log('Source Word doc Uploaded');

	let job = await documentGenerationJob(docGenAsset, 'pdf', { email, timestamp }, accessToken, CLIENT_ID);
	console.log('Generating new PDF');

	let docgenResult = await pollJob(job, accessToken, CLIENT_ID);
	console.log('Document generation job done');

	let sourceAsset = await getUploadData('application/pdf', accessToken, CLIENT_ID);
	await uploadFile(sourceAsset.uploadUri, SOURCE_PDF, 'application/pdf');
	console.log('Source PDF Uploaded.');

	job = await watermarkJob(sourceAsset, docgenResult.asset, accessToken, CLIENT_ID);
	console.log('Watermark Job created. Now to poll it.');

	let wmResult = await pollJob(job, accessToken, CLIENT_ID);
	console.log('Job is done.'); 


	let tspAccessToken = await getTSPAcccessToken({
		endpoint:TSP_ENDPOINT, 
		client_id:TSP_CLIENT_ID,
		client_secret:TSP_CLIENT_SECRET
	});

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
	};

	//await downloadFile(result.asset.downloadUri, 'watermarked_dynamic2.pdf');

	job = await sealJob(wmResult.asset, seal, accessToken, CLIENT_ID);
	console.log('Seal Job created. Now to poll it.');

	let result = await pollJob(job, accessToken, CLIENT_ID);
	console.log('Job is done.'); 
	console.log(result);

	console.log('All done!');
})();