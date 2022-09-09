const auth=require("@adobe/jwt-auth");
const fetch = require('node-fetch');
const fs = require('fs');


//Will switch to non-stage later
const REST_API = "https://pdf-services-stage.adobe.io/";

class ServicesWrapper {

	/*
	creds is an object with: 

		clientId:
		technicalAccountId
		orgId
		clientSecret
		privateKey
	*/


	constructor(creds) {

		if(!creds) throw('Creds object when creating a new ServicesWrapper object.');

		let issues = this.validateCreds(creds);
		if(issues.length) {
			throw(`Invalid creds object passed: ${issues.join('\n')}`);
		}
		this.creds = creds;

		this._cachedToken = null;

	}

	get accessToken() {

		if(this._cachedToken) return this._cachedToken;

		return new Promise(async (resolve, reject) => {

			this.creds.metaScopes = "https://ims-na1-stg1.adobelogin.com/s/ent_documentcloud_sdk";
			this.creds.ims = "https://ims-na1-stg1.adobelogin.com";
			let result = await auth(this.creds);
			this._cachedToken = result.access_token;
			resolve(this._cachedToken);
		});

	}

	async getUploadData(mediaType) {

		let token = await this.accessToken;
		let body = {
			'mediaType': mediaType
		};
		body = JSON.stringify(body);

		let req = await fetch(REST_API+'/assets', {
			method:'post',
			headers: {
				'X-API-Key':this.creds.clientId,
				'Authorization':`Bearer ${token}`,
				'Content-Type':'application/json'
			},
			body: body
		});

		let data = await req.json();
		return data;
	}

	async uploadFile(url, filePath, mediaType) {


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

	/*
	I simply the process of uploading. 
	*/
	async upload(filePath, mediaType) {
		let uploadData = await this.getUploadData(mediaType);
		await this.uploadFile(uploadData.uploadUri, filePath, mediaType);
		return uploadData;
	}

	async createOCRJob(asset) {

		let token = await this.accessToken;

		let body = {
			'assetID': asset.assetID
		};
		body = JSON.stringify(body);

		let req = await fetch(REST_API+'operation/ocr', {
			method:'post',
			headers: {
				'X-API-Key':this.creds.clientId,
				'Authorization':`Bearer ${token}`,
				'Content-Type':'application/json'
			},
			body: body
		});

		return req.headers.get('location');
	}

	async createCompressJob(asset, level="MEDIUM") {

		let token = await this.accessToken;

		let body = {
			'assetID': asset.assetID,
			'compressionLevel':level
		};
		body = JSON.stringify(body);

		let req = await fetch(REST_API+'operation/compresspdf', {
			method:'post',
			headers: {
				'X-API-Key':this.creds.clientId,
				'Authorization':`Bearer ${token}`,
				'Content-Type':'application/json'
			},
			body: body
		});

		return req.headers.get('location');
	}

	/* fragments not ready yet */
	async createDocumentGenerationJob(asset, outputFormat, data, fragments) {

		let token = await this.accessToken;

		let body = {
			'assetID': asset.assetID,
			'outputFormat': outputFormat, 
			'jsonDataForMerge':data
		};
		body = JSON.stringify(body);

		let req = await fetch(REST_API+'operation/documentgeneration', {
			method:'post',
			headers: {
				'X-API-Key':this.creds.clientId,
				'Authorization':`Bearer ${token}`,
				'Content-Type':'application/json'
			},
			body: body
		});

		return req.headers.get('location');
	}

	async pollJob(url) {

		let token = await this.accessToken;

		let status = null;
		let location; 

		while(status !== 'done') {
			let req = await fetch(url, {
				method:'GET',
				headers: {
					'X-API-Key':this.creds.clientId,
					'Authorization':`Bearer ${token}`,
				}
			});

			let res = await req.json();
			status = res.status;
			if(status === 'done') location = res.asset.downloadUri;
			else await this.delay(2000);
		}

		return location;
	}

	async downloadFile(url, filePath) {
		let res = await fetch(url);
		let stream = fs.createWriteStream(filePath);
		await new Promise((resolve, reject) => {
			res.body.pipe(stream);
			res.body.on('error', reject);
			stream.on('finish', resolve);
		});
		return;
	}


	/*
	I'll sit and poll the job and then dl for you when complete.
	*/
	async downloadWhenDone(job, downloadPath) {

		let downloadURL = await this.pollJob(job);
		await this.downloadFile(downloadURL, downloadPath);
		return;

	}


	// Lame function to add a delay to my polling calls
	async delay(x) {
		return new Promise(resolve => {
			setTimeout(() => resolve(), x);
		});
	}

	/*
	I return an array of exceptions, things missing basically
	*/
	validateCreds(c) {
		let issues = [];
		if(!c.clientId) issues.push('clientId missing');
		if(!c.technicalAccountId) issues.push('technicalAccountId missing');
		if(!c.orgId) issues.push('orgId missing');
		if(!c.clientSecret) issues.push('clientSecret missing');
		if(!c.privateKey) issues.push('privateKey missing');
		return issues;
	}

}

module.exports = ServicesWrapper;