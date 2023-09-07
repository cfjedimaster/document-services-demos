import 'dotenv/config';

import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1'});

// Used for my demo, change to your own
const bucket = 'acrobatservices';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function getSignedUploadUrl(path) {
	let command = new PutObjectCommand({ Bucket: bucket, Key:path });
	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

async function getSignedDownloadUrl(path) {
	let command = new GetObjectCommand({ Bucket: bucket, Key:path });
	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

async function getAccessToken(clientId, clientSecret) {

	return new Promise(async (resolve, reject) => {
		const params = new URLSearchParams();
		params.append('client_secret', clientSecret);
		params.append('grant_type', 'client_credentials');
		params.append('scope', 'openid,AdobeID,read_organizations');

		let resp = await fetch(`https://ims-na1.adobelogin.com/ims/token/v2?client_id=${clientId}`, 
			{ 
				method: 'POST', 
				body: params
			}
		);
		let data = await resp.json();
		resolve(data.access_token);
	});
}

async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

async function pollJob(token,url) {


	let status = null;
	let asset; 

	while(status !== 'done') {
		let req = await fetch(url, {
			method:'GET',
			headers: {
				'X-API-Key':CLIENT_ID,
				'Authorization':`Bearer ${token}`,
			}
		});

		let res = await req.json();

		status = res.status;
		if(status === 'done') {
			/*
			For everything (so far) but Extract, it's res.asset
			For extract, there's .content which points to the zip, 
			.resource which points to the whole zip
			*/
			if(res.asset) asset = res.asset;
			else if(res.content && res.resource) {
				asset = { content: res.content, resource: res.resource};
			}
		} else {
			console.log('Still working...');
			await delay(2000);
		}
	}

	return asset;
}

(async () => {

	let uploadURL = await getSignedUploadUrl('foo2.docx');

	let downloadURL = await getSignedDownloadUrl('PlanetaryScienceDecadalSurvey.pdf');

	let token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);

	let body = {
		"input": {
			"uri": downloadURL,
			"storage": "S3"
		},
		"output": {
			"uri": uploadURL,
			"storage": "S3"
		},
		"params": {
			"targetFormat": "docx",
			"ocrLang": "en-US"
		}
	};

	let resp = await fetch('https://pdf-services-ue1.adobe.io/operation/exportpdf', {
		method:'post', 
		headers: {
			'X-API-KEY':CLIENT_ID,
			'Content-Type':'application/json',
			'Authorization': `Bearer ${token}`
		}, 
		body: JSON.stringify(body)
	});

	let jobloc = await resp.headers.get('location');

	let done = await pollJob(token, jobloc);
	console.log('Done');


})();


