#!/usr/bin/python

import logging
import os.path
import zipfile
import sys
import uuid 

from adobe.pdfservices.operation.auth.credentials import Credentials
from adobe.pdfservices.operation.exception.exceptions import ServiceApiException, ServiceUsageException, SdkException
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_pdf_options import ExtractPDFOptions
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_element_type import ExtractElementType
from adobe.pdfservices.operation.execution_context import ExecutionContext
from adobe.pdfservices.operation.io.file_ref import FileRef
from adobe.pdfservices.operation.pdfops.extract_pdf_operation import ExtractPDFOperation
from adobe.pdfservices.operation.pdfops.options.extractpdf.extract_renditions_element_type import ExtractRenditionsElementType

logging.basicConfig(level=os.environ.get("LOGLEVEL", "INFO"))

def main(input,output):
	print(f"Going to extract {input} to {output}")

	# get base path.
	base_path = os.path.dirname(os.path.abspath(__file__))
	zip_file = base_path + "/" + str(uuid.uuid1()) + ".zip"

	try:
		
		# Initial setup, create credentials instance.
		credentials = Credentials.service_account_credentials_builder()\
			.from_file(base_path + "/pdftools-api-credentials.json") \
			.build()

		#Create an ExecutionContext using credentials and create a new operation instance.
		execution_context = ExecutionContext.create(credentials)
		extract_pdf_operation = ExtractPDFOperation.create_new()

		#Set operation input from a source file.
		source = FileRef.create_from_local_file(input)
		extract_pdf_operation.set_input(source)

		# Build ExtractPDF options and set them into the operation
		extract_pdf_options: ExtractPDFOptions = ExtractPDFOptions.builder() \
			.with_elements_to_extract([ExtractElementType.TEXT, ExtractElementType.TABLES]) \
			.with_elements_to_extract_renditions([ExtractRenditionsElementType.TABLES,ExtractRenditionsElementType.FIGURES]) \
			.build()

		extract_pdf_operation.set_options(extract_pdf_options)

		#Execute the operation.
		result: FileRef = extract_pdf_operation.execute(execution_context)

		# Save the result to the specified location.
		result.save_as(zip_file)

		file_to_extract = "structuredData.json"

		with zipfile.ZipFile(zip_file) as z:
			z.extractall(output)

		os.remove(zip_file)
		print(f"Done extracting to {output}")

	except (ServiceApiException, ServiceUsageException, SdkException):
		logging.exception("Exception encountered while executing operation")



if len(sys.argv) <= 2:
	print("Usage: generic.py input.pdf outputdirectory")
	sys.exit()

if __name__ == "__main__":
	main(sys.argv[1], sys.argv[2])

