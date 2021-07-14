const fs = require('fs');

const handler = async (event, context) => {
  try {
    let pdf = JSON.parse(event.body).pdf;
    let b = Buffer.from(pdf,'base64');
    fs.writeFileSync('./the_black_cat.pdf', b);

    return {
      statusCode: 200,
      body: JSON.stringify({ saved: true }),
      // // more keys you can return:
      // headers: { "headerName": "headerValue", ... },
      // isBase64Encoded: true,
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() }
  }
}

module.exports = { handler }
