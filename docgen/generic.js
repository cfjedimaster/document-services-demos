#!/usr/bin/env node

/*
Generic script, mainly for my use case, so I can quickly test doc gen stuff and 
focus on input and output.

Assumes pdftools-api-credentials.json in the same directory (which also assumes private.key)
*/

const PDFToolsSdk = require('@adobe/pdfservices-node-sdk');
// remove once sdk updated
const Fragments = require('@adobe/pdfservices-node-sdk/src/operation/option/documentmerge/fragments');

const chalk = require('chalk');
const fs = require('fs');

let input = process.argv[2];
let output = process.argv[3];
let data = process.argv[4];
let fragments = process.argv[5];
let fragmentsOb;

if(!input || !output) {
	console.error(chalk.red('Syntax: generic.js <input word doc> <output location> <optional location of json file> <optional location of fragments>'));
	process.exit(1);
}

if(!fs.existsSync(input)) {
	console.error(chalk.red(`Can't find input file ${input}`));
	process.exit(1);
}

if(input === output) {
	console.error(chalk.red('Output can`t be the same as input.'));
	process.exit(1);
}

let ext = input.split('.').pop().toLowerCase();
if(['docx'].indexOf(ext) === -1) {
	console.error(chalk.red(`Input file ${input} is not DOCX`));
	process.exit(1);
}

let outputExt = output.split('.').pop().toLowerCase();
if(['pdf','docx'].indexOf(outputExt) === -1) {
	console.error(chalk.red(`Output file ${input} is not PDF or DOCX`));
	process.exit(1);
}

// If it exists, delete it. Use with caution. Or not, your funeral.
if(fs.existsSync(output)) {
	console.log(chalk.yellow(`Output destination (${output}) exists - deleting.`));
	fs.unlinkSync(output);
}

/*
I've made data nullable so you can test JSONata stuff that works on it's own, but our API
requires *something*, so I send the object you see below. 
*/
if(data) {
    if(!fs.existsSync(data)) {
        console.error(chalk.red(`Can't find data file ${data}`));
        process.exit(1);
    } else data = JSON.parse(fs.readFileSync(data,'utf8'));
} else data = {_blank:true};

if(fragments) {
    if(!fs.existsSync(fragments)) {
        console.error(chalk.red(`Can't find fragments file ${fragmenmts}`));
        process.exit(1);
    } else {
        fragmentsOb = new Fragments();
        fragmentsOb.addFragment(JSON.parse(fs.readFileSync(fragments,'utf-8')));
    }
}

(async () => {

	console.log(chalk.green(`Merging ${input} with your data to create ${output}`));
	await generateFromTemplate(input, data, output, fragmentsOb, './pdftools-api-credentials.json');
	console.log(chalk.green(`Merging is now complete. Have a nice day.`));

})();

async function generateFromTemplate(template, data, dest, fragments, creds) {
    return new Promise((resolve, reject) => {

        // Initial setup, create credentials instance.
        const credentials =  PDFToolsSdk.Credentials
        .serviceAccountCredentialsBuilder()
        .fromFile(creds)
        .build();

        // Create an ExecutionContext using credentials.
        const executionContext = PDFToolsSdk.ExecutionContext.create(credentials);

        const documentMerge = PDFToolsSdk.DocumentMerge,
        documentMergeOptions = documentMerge.options;

        //dest determines if Word or PDF
        let format;
        let destExt = dest.split('.').pop().toLowerCase();
        if(destExt === 'docx') format = documentMergeOptions.OutputFormat.DOCX;
        else if(destExt === 'pdf') format = documentMergeOptions.OutputFormat.PDF;
        else throw('Invalid destination extension')

        // Create a new DocumentMerge options instance.
        if(!fragments) options = new documentMergeOptions.DocumentMergeOptions(data, format);
        else options = new documentMergeOptions.DocumentMergeOptions(data, format, fragmentsOb);

        // Create a new operation instance using the options instance.
        const documentMergeOperation = documentMerge.Operation.createNew(options);

        // Set operation input document template from a source file.
        const input = PDFToolsSdk.FileRef.createFromLocalFile(template);
        documentMergeOperation.setInput(input);

        // Execute the operation and Save the result to the specified location.
        documentMergeOperation.execute(executionContext)
        .then(result => result.saveAsFile(dest))
        .then(() => resolve(true))
        .catch(err => {
            if(err instanceof PDFToolsSdk.Error.ServiceApiError
                || err instanceof PDFToolsSdk.Error.ServiceUsageError) {
                console.log('Exception encountered while executing operation', err);
                reject(err);
            } else {
                console.log('Exception encountered while executing operation', err);
                reject(err);
            }
        });

    });

}