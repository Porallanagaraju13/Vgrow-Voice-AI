const http = require('http');

// To test this, you will need to replace the business_id below
// with a real business_id from your Supabase 'businesses' table.
const payload = JSON.stringify({
  business_id: 'REPLACE_WITH_YOUR_BUSINESS_ID',
  name: 'Jane Doe Test',
  phone: '8332970360', // Note: use a verified Twilio trial number to test calls
  notes: 'Testing Campaign Webhook Integration via script'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/campaign/submit',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

console.log('Sending test lead to webhook...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE:', responseData);
    console.log('\n--- Next Steps ---');
    console.log('1. Check the Supabase "leads" table to see if Jane Doe Test was added.');
    console.log('2. Check the Supabase "outbound_calls" table for a new call record.');
    console.log('3. If NGROK is running and Twilio is set up, your phone should be ringing!');
  });
});

req.on('error', (error) => {
  console.error('Webhook Request Error:', error);
});

req.write(payload);
req.end();
