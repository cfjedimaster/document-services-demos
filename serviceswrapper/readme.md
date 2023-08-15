# ServicesWrapper

This is a simple JavaScript wrapper to the Acrobat Services. It requires OAuth Server-To-Server auth, so clientId and clientSecret.

Only a few endpoints are supported and some already in here will be modified. Right now, if I have a sample script for
the endpoint, it means it's "mostly" done (if that makes sense).

## Usage

Initialize the library with your credentials:

```js
let sw = new ServicesWrapper(process.env.CLIENTID, process.env.CLIENTSECRET);
```

Upload assets by path and media type:

```js
let filePath = '../source_pdfs/schoolcalendar.pdf';
let mediaType = 'application/pdf';

let asset = await sw.upload(filePath, mediaType);
```

Note that this wraps the 2 step REST process of creating the asset and uploading the bits.

Call an endpoint:

```js
let job = await sw.createExtractJob(asset);
console.log('Extract job started.');
```

You can `pollJob`, which will hit the job status until done. 

You can `downloadFile` to get the result.

And you can `downloadWhenDone(job, path)` to simplify the above.


## History

08/15/2023: Moved to new folder, added `apiWrapper`, added Extract support.

## To Do

Migrate the other end points to look like Extract.