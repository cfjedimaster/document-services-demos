/*
A quick script to test getting the image from the URL to b64
*/

let url = `https://quickchart.io/chart?c={type:'line',data:{labels:['11/2020','12/2020','1/2021','2/2021','3/2021','4/2021'],datasets:[{label:'Cats',data:[210,354,321,337,298,274]}]}}`;

const fetch = require('node-fetch');

(async () => {

	let resp = await fetch(url);
	let header = resp.headers.get('content-type');
	let body = await resp.arrayBuffer();
	
	data = "data:" + resp.headers.get("content-type") + ";base64," + Buffer.from(body).toString('base64');
	console.log(data);
	
})();


