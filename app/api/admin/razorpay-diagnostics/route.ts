import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

function makeRazorpayRequest(
  path: string,
  keyId: string,
  keySecret: string,
  method: string = 'GET',
  postData: any = null
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const options: https.RequestOptions = {
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
      const dataStr = JSON.stringify(postData);
      (options.headers as Record<string, string | number>)['Content-Length'] = Buffer.byteLength(dataStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode || 500, data: parsed });
        } catch {
          resolve({ status: res.statusCode || 500, data });
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

export async function GET(req: NextRequest) {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    return NextResponse.json(
      {
        success: false,
        error: 'Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing from server environment.',
        keyIdConfigured: Boolean(keyId),
        keySecretConfigured: Boolean(keySecret),
      },
      { status: 500 }
    );
  }

  const isLive = keyId.startsWith('rzp_live_');
  const isTest = keyId.startsWith('rzp_test_');
  const keyMode = isLive ? 'LIVE' : isTest ? 'TEST' : 'CUSTOM';
  const maskedKeyId = keyId.length > 8 ? `${keyId.substring(0, 8)}...${keyId.slice(-4)}` : '***';

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    keyIdMasked: maskedKeyId,
    mode: keyMode,
    isLiveKey: isLive,
    isTestKey: isTest,
    accountStatus: 'UNKNOWN',
    methods: null,
    upiStatus: {
      upiEnabled: false,
      upiIntentEnabled: false,
      upiQrSupported: false,
      autopayCollect: false,
      autopayIntent: false,
    },
    otherMethods: {
      card: false,
      netbanking: false,
      wallet: false,
      nach: false,
    },
    orderCreationTest: {
      success: false,
      orderId: null,
      status: null,
      error: null,
    },
    restrictionsOrNotes: [],
  };

  try {
    // 1. Check /v1/methods
    const methodsRes = await makeRazorpayRequest(`/v1/methods?key_id=${keyId}`, keyId, keySecret);
    if (methodsRes.status === 200 && methodsRes.data) {
      const data = methodsRes.data;
      diagnostics.methods = data;
      diagnostics.accountStatus = 'ACTIVE';

      // UPI capabilities
      const hasUpi = Boolean(data.upi);
      const hasUpiIntent = Boolean(data.upi_intent);
      diagnostics.upiStatus = {
        upiEnabled: hasUpi,
        upiIntentEnabled: hasUpiIntent,
        upiQrSupported: hasUpi, // Dynamic QR code is provided by Razorpay when UPI is active on web checkout
        autopayCollect: Boolean(data.upi_autopay?.collect),
        autopayIntent: Boolean(data.upi_autopay?.intent),
      };

      // Other methods
      diagnostics.otherMethods = {
        card: Boolean(data.card),
        netbanking: Boolean(data.netbanking),
        wallet: Boolean(data.wallet),
        nach: Boolean(data.nach),
      };

      if (!hasUpi) {
        diagnostics.restrictionsOrNotes.push(
          'UPI is currently inactive on this Razorpay account. Enable it in Razorpay Dashboard > Settings > Payment Methods > UPI.'
        );
      }
    } else {
      diagnostics.accountStatus = 'METHODS_QUERY_FAILED';
      diagnostics.restrictionsOrNotes.push(
        `Failed to query /v1/methods: HTTP ${methodsRes.status}. Check API permissions or Key Secret.`
      );
    }

    // 2. Dry-run Order Creation Test
    const orderRes = await makeRazorpayRequest('/v1/orders', keyId, keySecret, 'POST', {
      amount: 10000, // 100 INR
      currency: 'INR',
      receipt: `diag_${Date.now().toString().slice(-8)}`,
      notes: {
        diagnostic_check: 'Suroor Villa Account Audit',
      },
    });

    if (orderRes.status === 200 || orderRes.status === 201) {
      diagnostics.orderCreationTest = {
        success: true,
        orderId: orderRes.data.id,
        status: orderRes.data.status,
        error: null,
      };
    } else {
      diagnostics.orderCreationTest = {
        success: false,
        orderId: null,
        status: null,
        error: orderRes.data?.error?.description || `HTTP ${orderRes.status}`,
      };
      diagnostics.restrictionsOrNotes.push(
        `Order creation failed: ${orderRes.data?.error?.description || 'Unknown error'}`
      );
    }

    return NextResponse.json({
      success: true,
      diagnostics,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Razorpay diagnostics failed.',
        diagnostics,
      },
      { status: 500 }
    );
  }
}
