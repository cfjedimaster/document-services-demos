import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import mime from 'mime';

const REST_API = "https://pdf-services.adobe.io/";

class ServicesWrapper {

	constructor(clientId, clientSecret) {

		if(!clientId) throw('clientId required when constructing ServicesWrapper');
		if(!clientSecret) throw('clientSecret required when constructing ServicesWrapper');

		this.creds = { clientId, clientSecret };

		this._cachedToken = null;

	}

	get accessToken() {

		if(this._cachedToken) return this._cachedToken;

		return new Promise(async (resolve, reject) => {

			const params = new URLSearchParams();
			params.append('client_id', this.creds.clientId);
			params.append('client_secret', this.creds.clientSecret);

			let resp = await fetch('https://pdf-services-ue1.adobe.io/token', 
				{ 
					method: 'POST', 
					body: params,
					headers: {
					'Content-Type':'application/x-www-form-urlencoded'
				},
			}
			);
			let data = await resp.json();
			this._cachedToken = data.access_token;
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
			duplex:'half',
			body:stream
		});

		if(upload.status === 200) return;
		else {
			throw('Bad result, handle later.');
		}

	}

	/*
	I simplify the process of uploading. 
	*/
	async upload(filePath, mediaType) {
		if(!mediaType) mediaType = mime.getType(filePath);
		let uploadData = await this.getUploadData(mediaType);
		await this.uploadFile(uploadData.uploadUri, filePath, mediaType);
		return uploadData;
	}

	async apiWrapper(endpoint, body) {
		let token = await this.accessToken;

		body = JSON.stringify(body);

		let req = await fetch(REST_API+endpoint, {
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

	async createOCRJob(asset) {


		let body = {
			'assetID': asset.assetID
		};

		return await this.apiWrapper('operation/ocr',body);
	}

	async createCompressJob(asset, level="MEDIUM") {


		let body = {
			'assetID': asset.assetID,
			'compressionLevel':level
		};

		return await this.apiWrapper('operation/compresspdf',body);

	}

	/* fragments not ready yet */
	async createDocumentGenerationJob(asset, outputFormat, data, fragments) {

		let body = {
			'assetID': asset.assetID,
			'outputFormat': outputFormat, 
			'jsonDataForMerge':data
		};

		return await this.apiWrapper('operation/documentgeneration',body);

	}

	async createExtractJob(asset, options={}) {

		let body = {
			'assetID': asset.assetID,
			'getCharBounds': options.getCharBounds?options.getCharBounds:false,
			'includeStyling': options.includeStyling?options.includeStyling:false, 
			'elementsToExtract': options.elementsToExtract?options.elementsToExtract:['text', 'tables'],
			'tableOutputFormat':options.tableOutputFormat?options.tableOutputFormat:'csv',
			'renditionsToExtract': options.renditionsToExtract?options.renditionsToExtract:[ 'tables', 'figures' ]
		};

		return await this.apiWrapper('operation/extractpdf',body);
	}

	async createPDFJob(asset, options={}) {

		let body = {
			'assetID': asset.assetID,
			'documentLanguage': options.documentLanguage?options.documentLanguage:'en-US'
		};

		return await this.apiWrapper('operation/createpdf',body);
	}
	
	// ToDo: use style used for Extract
	async createProtectJob(asset, passwordProtection, encryptionAlgorithm, contentToEncrypt, permissions) {

		let body = {
			'assetID': asset.assetID,
			'passwordProtection': passwordProtection, 
			'encryptionAlgorithm':encryptionAlgorithm
		};

		if(contentToEncrypt) body.contentToEncrypt = contentToEncrypt;
		if(permissions) body.permissions = permissions;
		
		return await this.apiWrapper('operation/protectpdf',body);
	}

	async pollJob(url) {

		let token = await this.accessToken;

		let status = null;
		let asset; 

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
			} else if(status === 'failed') {
				throw(res.error);
			} else {
				await this.delay(2000);
			}
		}

		return asset;
	}

	// Credit: https://stackoverflow.com/a/74722656/52160
	async downloadFile(url, filePath) {
		let res = await fetch(url);
		const body = Readable.fromWeb(res.body);
		const download_write_stream = fs.createWriteStream(filePath);
		return await finished(body.pipe(download_write_stream));
	}

	/*
	I'll sit and poll the job and then dl for you when complete.
	*/
	async downloadWhenDone(job, downloadPath) {

		let jobResult = await this.pollJob(job);
		await this.downloadFile(jobResult.downloadUri, downloadPath);
		return;
	}


	// Lame function to add a delay to my polling calls
	async delay(x) {
		return new Promise(resolve => {
			setTimeout(() => resolve(), x);
		});
	}

}

export default ServicesWrapper;