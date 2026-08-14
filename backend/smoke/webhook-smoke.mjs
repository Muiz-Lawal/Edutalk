import crypto from 'crypto';
import fetch from 'node-fetch';

// Config - adjust to match local .env values
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5001/api/payments/webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_1234567890123456789012345678';

async function sendSignedEvent(bodyObj) {
  const body = JSON.stringify(bodyObj);
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${body}`;
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedPayload).digest('hex');
  const sigHeader = `t=${timestamp},v1=${hmac}`;

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': sigHeader,
    },
    body,
  });

  const text = await res.text();
  return { status: res.status, body: text };
}

(async function main() {
  const fakeEvent = {
    id: 'evt_test_webhook_1',
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: `pi_mock_${Date.now()}`,
        metadata: {
          classId: '000000000000000000000000',
          userId: '000000000000000000000000',
          numberOfDays: '7'
        }
      }
    }
  };

  try {
    const result = await sendSignedEvent(fakeEvent);
    console.log('Webhook POST response status:', result.status);
    console.log('Response body:', result.body);
    if (result.status === 200) process.exit(0);
    process.exit(2);
  } catch (err) {
    console.error('Webhook smoke failed:', err.message || err);
    process.exit(1);
  }
})();
