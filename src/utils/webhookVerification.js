const crypto = require('crypto');

/**
 * Verify Shopify webhook signature
 * @param {Buffer} rawBody - The raw request body
 * @param {string} signature - The signature from X-Shopify-Hmac-SHA256 header
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(rawBody, signature) {
  // Skip verification in mock mode
  const isMockMode = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1';
  if (isMockMode) {
    console.log('[MOCK MODE] Skipping webhook signature verification');
    return true;
  }

  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('WEBHOOK_SECRET environment variable is not set');
    return false;
  }

  if (!rawBody || !signature) {
    return false;
  }

  // Calculate HMAC
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(rawBody, 'utf8');
  const calculatedSignature = hmac.digest('base64');

  // Compare signatures using constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'base64'),
    Buffer.from(calculatedSignature, 'base64')
  );
}

module.exports = {
  verifyWebhookSignature
};

