import logging
import os.path
import zipfile

from adobe.pdfservices.operation.auth.credentials import Credentials
from adobe.pdfservices.operation.exception.exceptions import ServiceApiException, ServiceUsageException, SdkException
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_pdf_options import ExtractPDFOptions
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_element_type import ExtractElementType
from adobe.pdfservices.operation.execution_context import ExecutionContext
from adobe.pdfservices.operation.io.file_ref import FileRef
from adobe.pdfservices.operation.pdfops.extract_pdf_operation import ExtractPDFOperation
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_renditions_element_type import ExtractRenditionsElementType

logging.basicConfig(level=os.environ.get("LOGLEVEL", "INFO"))

# get base path.
base_path = os.path.dirname(os.path.abspath(__file__))
zip_file = base_path + "/python_extract.zip"

# I added code to remove the zip after getting the json, but keeping this to be sure
if os.path.isfile(zip_file):
	print(f"Previous zip file {zip_file} exists, removing it.")
	os.remove(zip_file)

try:
	
	# Initial setup, create credentials instance.
	credentials = Credentials.service_account_credentials_builder()\
		.from_file(base_path + "/pdftools-api-credentials.json") \
		.build()

	#Create an ExecutionContext using credentials and create a new operation instance.
	execution_context = ExecutionContext.create(credentials)
	extract_pdf_operation = ExtractPDFOperation.create_new()

	#Set operation input from a source file.
	#source = FileRef.create_from_local_file(base_path + "/mnt/c/Users/ray/Downloads/AnalogDialogue.pdf")
	source = FileRef.create_from_local_file("/mnt/c/Users/ray/Downloads/victoria_bridge_50.pdf")
	extract_pdf_operation.set_input(source)

	# Build ExtractPDF options and set them into the operation
	#extract_pdf_options: ExtractPDFOptions = ExtractPDFOptions.builder() \
	#	.with_element_to_extract(ExtractElementType.TEXT) \
	#	.build()
    
	extract_pdf_options: ExtractPDFOptions = ExtractPDFOptions.builder() \
		.with_elements_to_extract([ExtractElementType.TEXT, ExtractElementType.TABLES]) \
		.with_elements_to_extract_renditions([ExtractRenditionsElementType.TABLES,
        ExtractRenditionsElementType.FIGURES]) \
        .build()

	extract_pdf_operation.set_options(extract_pdf_options)

	#Execute the operation.
	result: FileRef = extract_pdf_operation.execute(execution_context)

	# Save the result to the specified location.
	result.save_as(zip_file)

	file_to_extract = "structuredData.json"

	# extract the json
	with zipfile.ZipFile(zip_file) as z:
		with open(file_to_extract, 'wb') as f:
			f.write(z.read(file_to_extract))
			print("Extracted", file_to_extract)
			#os.remove(zip_file)

except (ServiceApiException, ServiceUsageException, SdkException):
	logging.exception("Exception encountered while executing operation")