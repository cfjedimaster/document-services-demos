from adobe.pdfservices.operation.auth.credentials import Credentials
from adobe.pdfservices.operation.exception.exceptions import ServiceApiException, ServiceUsageException, SdkException
from adobe.pdfservices.operation.execution_context import ExecutionContext
from adobe.pdfservices.operation.io.file_ref import FileRef
from adobe.pdfservices.operation.pdfops.extract_pdf_operation import ExtractPDFOperation
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_renditions_element_type import ExtractRenditionsElementType
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_pdf_options import ExtractPDFOptions
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_element_type import ExtractElementType

import os.path
import zipfile

output_zip = "./output.zip"
output_path = "./output/"

# We remove at the end, but this is just in case...
if os.path.isfile(output_zip):
	os.remove(output_zip)

input_pdf = "./input.pdf"

try:

	#Initial setup, create credentials instance.
	credentials = Credentials.service_account_credentials_builder()\
		.from_file("./pdfservices-api-credentials.json") \
		.build()

	#Create an ExecutionContext using credentials and create a new operation instance.
	execution_context = ExecutionContext.create(credentials)
	extract_pdf_operation = ExtractPDFOperation.create_new()

	#Set operation input from a source file.
	source = FileRef.create_from_local_file(input_pdf)
	extract_pdf_operation.set_input(source)

	#Build ExtractPDF options and set them into the operation
	extract_pdf_options: ExtractPDFOptions = ExtractPDFOptions.builder() \
		.with_elements_to_extract_renditions([ExtractRenditionsElementType.FIGURES]) \
		.build()

	extract_pdf_operation.set_options(extract_pdf_options)

	#Execute the operation.
	result: FileRef = extract_pdf_operation.execute(execution_context)

	#Save the result to the specified location.
	result.save_as(output_zip)

	print("Successfully extracted information from PDF.\n")

	archive = zipfile.ZipFile(output_zip, 'r')
	archive.extractall(output_path)

	print(f"Extracted zip to {output_path}")
	archive.close()
	
	os.remove(output_zip)

except (ServiceApiException, ServiceUsageException, SdkException):
	logging.exception("Exception encountered while executing operation")
