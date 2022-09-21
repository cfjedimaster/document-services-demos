import datetime
import json
import jwt
import os
import requests
import sys

from dotenv import load_dotenv
load_dotenv('.env')

CLIENT_ID = os.environ.get('CLIENTID')
CLIENT_SECRET = os.environ.get('CLIENTSECRET')
TECHNICAL_ACCOUNT_ID = os.environ.get('TECHNICALACCOUNTID')
ORG_ID = os.environ.get('ORGID')
KEY = os.environ.get('KEY')

REST_API = "https://pdf-services-stage.adobe.io/"

def getAccessToken(creds):
	# todo, change to prod
	url = "https://ims-na1-stg1.adobelogin.com/ims/exchange/jwt"

	jwtPayloadRaw = f"""
	{{ 
		"iss": "{creds['org_id']}",
		"sub": "{creds['technical_account_id']}",
		"https://ims-na1-stg1.adobelogin.com/s/ent_documentcloud_sdk": true,
		"aud": "https://ims-na1-stg1.adobelogin.com/c/{creds['client_id']}" 
	}}
	"""

	jwtPayloadJson = json.loads(jwtPayloadRaw)
	jwtPayloadJson["exp"] = datetime.datetime.utcnow() + datetime.timedelta(seconds=30)

	accessTokenRequestPayload = {
		'client_id': creds['client_id'],
		'client_secret': creds['client_secret']
	}


	jwttoken = jwt.encode(jwtPayloadJson, KEY, algorithm='RS256')

	accessTokenRequestPayload['jwt_token'] = jwttoken
	result = requests.post(url, data = accessTokenRequestPayload)
	resultjson = json.loads(result.text)

	return resultjson['access_token']


def getUploadData(creds, access_token, mediaType):
	body = body = {
		'mediaType': mediaType
	}

	headers = {
		'X-API-Key':creds["client_id"],
		'Authorization': f"Bearer {access_token}",
		'Content-Type':'application/json'
	}

	result = requests.post(REST_API + "/assets", data = json.dumps(body), headers = headers)
	return result.json()


def uploadFile(url, filePath, mediaType):

	headers = {
		"Content-Type":mediaType,
	}

	request = requests.put(url, data=open(filePath,'rb'), headers=headers)
	#print(request.text)
	#print(request.status_code)
	return(request.status_code == 200)


def createOCRJob(asset, clientId, token):

	body = {
		'assetID': asset 
	}

	headers = {
		"X-API-Key":clientId,
		"Authorization":f"Bearer {token}",
		"Content-Type":"application/json"
	}

	request = requests.post(REST_API + "operation/ocr", data=json.dumps(body), headers=headers)
	# todo, validation
	if(request.status_code == 201):
		return(request.headers["location"])
	else:
		# handle error
		print("ERROR", request.text)
		sys.exit()
	

creds = {
	"client_id": CLIENT_ID, 
	"client_secret": CLIENT_SECRET, 
	"org_id": ORG_ID, 
	"technical_account_id": TECHNICAL_ACCOUNT_ID
}

# First, generate our access token to use later
access_token = getAccessToken(creds)

# Now get an upload uri so we can put stuff later
result = getUploadData(creds, access_token, "application/pdf")
uploadUri = result["uploadUri"]
assetId = result["assetID"]


result = uploadFile(uploadUri, "./pdf_that_needs_ocr.pdf", "application/pdf")

if(result == False):
	print("Bad result from upload")
	sys.exit()

print("Uploaded PDF.")


jobUrl = createOCRJob(assetId, creds["client_id"], access_token)
print(jobUrl)
