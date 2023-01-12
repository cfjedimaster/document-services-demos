from pyzbar.pyzbar import decode
from PIL import Image
import os

# where to find the images
figure_directory = "./output/figures"

files = os.listdir(figure_directory)

for f in files:
	img = Image.open(figure_directory + "/" + f)
	all_info = decode(img)
	if len(all_info) > 0:
		print(f"Detected {len(all_info)} bar/qrcodes in {f}:")
		for detected in all_info:
			print(f"\tFound a {detected.type} with data {detected.data.decode()}")
		print("")
