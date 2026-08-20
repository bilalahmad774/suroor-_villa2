const https = require('https');

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

console.log('====================================================');
console.log('       RAZORPAY ACCOUNT & METHOD DIAGNOSTIC');
console.log('====================================================');

if (!keyId || !keySecret) {
  console.error('❌ ERROR: Razorpay credentials are missing in the environment!');
  console.log(`- RAZORPAY_KEY_ID: ${keyId ? 'SET (' + keyId.substring(0, 8) + '...)' : 'MISSING'}`);
  console.log(`- RAZORPAY_KEY_SECRET: ${keySecret ? 'SET' : 'MISSING'}`);
  process.exit(1);
}

const isLiveKey = keyId.startsWith('rzp_live_');
const isTestKey = keyId.startsWith('rzp_test_');

console.log(`🔑 Key ID: ${keyId.substring(0, 8)}... (Mode: ${isLiveKey ? 'LIVE' : isTestKey ? 'TEST' : 'UNKNOWN'})`);
console.log(`🔒 Key Secret: ${keySecret ? 'CONFIGURED (' + keySecret.length + ' chars)' : 'MISSING'}`);

// Basic auth header
const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

function makeRequest(path, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(postData));
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runDiagnostics() {
  console.log('\n--- 1. Fetching Enabled Payment Methods from Razorpay API (/v1/methods) ---');
  try {
    const methodsRes = await makeRequest('/v1/methods');
    console.log(`HTTP Status: ${methodsRes.status}`);
    if (methodsRes.status === 200) {
      const methods = methodsRes.data;
      console.log('✅ Methods endpoint returned successfully:');
      console.log(`- UPI Enabled: ${methods.upi ? '✅ YES' : '❌ NO'}`);
      console.log(`- Cards Enabled: ${methods.card ? '✅ YES' : '❌ NO'}`);
      console.log(`- NetBanking Enabled: ${methods.netbanking ? '✅ YES' : '❌ NO'}`);
      console.log(`- Wallets Enabled: ${methods.wallet ? '✅ YES' : '❌ NO'}`);
      if (methods.upi_apps) {
        console.log(`- Supported UPI Apps: ${JSON.stringify(methods.upi_apps)}`);
      }
      console.log('\nFull Methods Response:', JSON.stringify(methods, null, 2));
    } else {
      console.log('Response:', JSON.stringify(methodsRes.data, null, 2));
    }
  } catch (err) {
    console.error('Error querying /v1/methods:', err.message);
  }

  console.log('\n--- 2. Testing Order Creation with INR Currency (/v1/orders) ---');
  try {
    const orderRes = await makeRequest('/v1/orders', 'POST', {
      amount: 50000, // 500 INR
      currency: 'INR',
      receipt: `diag_${Date.now().toString().slice(-8)}`,
      notes: {
        diagnostic: 'Razorpay UPI & Account Check',
      },
    });

    console.log(`HTTP Status: ${orderRes.status}`);
    if (orderRes.status === 200 || orderRes.status === 201) {
      console.log('✅ Order creation succeeded:');
      console.log(`- Order ID: ${orderRes.data.id}`);
      console.log(`- Amount: ${orderRes.data.amount / 100} ${orderRes.data.currency}`);
      console.log(`- Status: ${orderRes.data.status}`);
    } else {
      console.log('❌ Order creation returned error:', JSON.stringify(orderRes.data, null, 2));
    }
  } catch (err) {
    console.error('Error creating order:', err.message);
  }

  console.log('\n====================================================');
  console.log('             DIAGNOSTIC SUMMARY');
  console.log('====================================================');
  console.log('If UPI is "false" in /v1/methods:');
  console.log('1. Log in to https://dashboard.razorpay.com');
  console.log('2. Navigate to Settings > Payment Methods');
  console.log('3. Ensure UPI and QR are toggled ON and activated.');
  console.log('4. Note: If business KYC is under review or international-only, Razorpay restricts UPI until domestic verification completes.');
  console.log('====================================================\n');
}

runDiagnostics();
