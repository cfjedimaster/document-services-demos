/*
In this file, we take the result from our Extract operation and pass it to Diffbot
*/

import 'dotenv/config';
import fs from 'fs';

const DIFFBOT_KEY = process.env.DIFFBOT_KEY;
const SOURCE_JSON = './extract.json';
const data = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8'));

console.log(`Read in source data from ${SOURCE_JSON}.`);

let text = data.elements.reduce((text, el) => {
	if(el.Text) text += el.Text + '\n';
	return text;
},'');

let fields = 'summary';
let url = `https://nl.diffbot.com/v1/?fields=${fields}&token=${DIFFBOT_KEY}`;
	
let body = [{
	content:text, 
	lang:'en',
	format:'plain text'
}];

console.log('Passing text to Diffbot.'); 

let req = await fetch(url, { 
	method:'POST',
	body:JSON.stringify(body),
	headers: { 'Content-Type':'application/json' }
});

let result = await req.json();
console.log(`Summary of PDF:\n${result[0].summary}`);