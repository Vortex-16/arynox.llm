const axios = require('axios');
const fs = require('fs');
const path = require('path');

const invokeUrl = "https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v1";
const headers = {
  "Authorization": "Bearer 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",
  "Accept": "application/json"
};

async function test() {
  const filePath = path.join(__dirname, 'uploads', fs.readdirSync(path.join(__dirname, 'uploads')).find(f => f.endsWith('.pdf')));
  console.log('Testing with PDF:', filePath);
  const data = fs.readFileSync(filePath);
  const pdfB64 = Buffer.from(data).toString('base64');
  if (pdfB64.length > 180000) {
      console.log('PDF too large to inline base64, limiting to first 180k for test');
  }

  const payload = {
    "input": [
      {
        "type": "image_url",
        "url": `data:application/pdf;base64,${pdfB64.slice(0, 150000)}`
      }
    ]
  };

  try {
    const response = await axios.post(invokeUrl, payload, { headers: headers, responseType: 'json' });
    console.log(JSON.stringify(response.data));
  } catch(error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
test();
