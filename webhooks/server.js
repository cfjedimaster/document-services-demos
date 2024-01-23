/*
Used to debug webhook notifications. 
Will need to be used with ngrok.
Thanks to Todd Sharp for the base code I modified.
*/

import * as http from 'http';

async function handler(req, res) {
	console.log('Entered webhook handler.');
	let body = '';
	req.on('data', chunk => {
		body += chunk.toString();
	});

	req.on('end', async () => {

		console.log('BODY:\n', JSON.stringify(JSON.parse(body), null, '\t'));
		// If you specified additional headers (see createpdf2.js), it will show up there:
		console.log('HEADERS:\n',req.headers);
		// Always respond with ack
		res.writeHead(200, { 'Content-Type':'application/json' });
		res.write(JSON.stringify({'ack':'done'}));
		res.end();

	});


}

const server = http.createServer(handler);
server.listen(3000);
console.log('Listening on port 3000');