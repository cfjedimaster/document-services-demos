## ReadMe

Welcome to my repository of demos, scripts, tools, and more for [Adobe Acrobat Services](https://developer.adobe.com/document-services/homepage). There are quite a few things in this repository and a good portion of it is crap I wrote for one off tests, my own curiosity, and so forth. There's also a whole folder (`/article_support`) for demos related to my blog posts. That being said, there are some useful scripts in here I think folks may like. While you are free to use anything and everything here, I'd consider the items below to be useful and somewhat stable. 

For everything in here, you will need credentials. You can sign up for free at <https://www.adobe.io/apis/documentcloud/dcsdk/gettingstarted.html>. Most of the demos in this repository are related to our server-side APIs (PDF Services, Document Generation, PDF Extract), but I've got a few Embed demos as well. For that you will need your own key as well. For the scripts using PDF Services, the credentials are expected to be in the same directory. Notice that some of my older scripts look for `./pdftools-api-credentials.json`. This was the filename used when PDF Services was known as PDF Tools. So if you do just copy your credentials into the directory, you will either need to rename (or just copy) the JSON file or edit the script.

Some of my demos make use of `@adobe/documentservices-pdftools-node-sdk`, the older SDK. I include both this and the new SDK in my `package.json` file, but obviously I would not recommend using the older SDK in production.

If you have any questions about the scripts (either those listed below are others), you may file an issue here, or reach out to me directly (I'm @raymondcamden on Twitter and my DMs are open). 

Enjoy!

### PDF Services Demos

Note that many of these scripts have input and output values hard coded as variables on top of the page. This is easy to change, but still required you to actually, you know, edit code. In some cases, I support passing in the values via arguments. I'm going to try to build more scripts like that. 

**services/convert_html_to_pdf.js**<br/>
Converts a hard coded HTML file to PDF. You can change the input and output in these lines:

```js
const inputFile = '/mnt/c/Users/ray/Downloads/email.html';
const output = './html_to_pdf.pdf';
```

**services/convert_word_to_pdf.js**<br/>
Despite the name, can be used to convert any supported file type to PDF. Modify these lines:

```js
const input = '/mnt/c/Users/ray/Desktop/hello.docx';
const output = './hello.pdf';
```

**services/generic_export.js**<br/>
As the name says, a generic export script. Input and output are passed via the CLI. I'd use `convert.js` instead though.

**services/generic_ocr.js**<br/>
As the name says, a generic ocr script. Input and output are passed via the CLI. You can also specify a [supported locale](https://opensource.adobe.com/pdfservices-node-sdk-samples/apidocs/latest/OCROptions.html#.OCRSupportedLocale).

**services/convert.js**<br/>
A more generic script. Either pass foo.pdf foo.supportedExt to go from PDF to a supported format, or foo.supportedExt foo.pdf to go from a supported format to PDF. 

**services/merge.js**<br/>
A script that tests the PDF Merge operation. Use it at the command line like so:

```bash 
node merge.js a.pdf,b.pdf,c.pdf output.pdf
```

Where the first argument is a list of source PDFs and the last argument is the filename to use for the result.

**services/ocr_example.js**<br/>
Does a quick OCR on a PDF. As with others, modify the inputs here:

```js
const input = './pdf_that_needs_ocr.pdf';
const output = './pdf_that_is_now_ocr.pdf';
```

Also note that both of those PDFs above are in the repo if you just want to see a before and after example.

**services/properties.js**<br/>

A test of the PDF Properties feature. As before, tweak these lines:

```js
const input = './hamlet.pdf';
const creds = './pdftools-api-credentials.json';
```

### PDF Extract Demos

**extract_examples/generic.js**<br/>
A utility for testing PDF extract. Call it at the command line like so:

```bash
./generic.js input.pdf outputdir
```

This uses all the features of Extract so you will get the JSON result, images, and tables as images and CSVs. The zip result from the API is automatically extracted into `outputdir`. 

**extract_examples/test1.py**<br/>
A Python example. It only gets the JSON output but does handle automatically unzipping.

**extract_examples/generic.py**<br/>
A utility for testing PDF extract. This time in Python cuz Python is crazy awesome. Call it at the command line like so:

```bash
./generic.py input.pdf outputdir
```

This uses all the features of Extract so you will get the JSON result, images, and tables as images and CSVs. The zip result from the API is automatically extracted into `outputdir`. 

### Document Generation Demos

**docgen/generic.js**<br/>

A utility for testing document generation from the command line. Call it like so:

```bash
node generic.js inputWordDoc output.pdf optionalJSONFile
```

The JSON file argument is optional although almost always you're going to use it. Note that the output argument can be something.docx as well if you want to test Word output. 

### PDF Embed Examples

**embed_examples/annotation.html** and **embed_examples/annotation2.html**<br/>

Both files demonstrate getting annotations from a PDF. The first is simpler - you click a button to dump current annotations. The second is better as it uses an event handler to notice new annotations and automatically update the log. Annotations are complex, so these demos are good for seeing their structure.

**embed_examples/basic.html**<br/>
Basic example, nothing fancy.


