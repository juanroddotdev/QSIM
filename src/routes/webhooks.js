const express = require('express');
const router = express.Router();
const { verifyWebhookSignature } = require('../utils/webhookVerification');
const { processOrderPaid } = require('../services/webhookService');

/**
 * POST /webhooks/order-paid
 * Handles Shopify order/paid webhook events
 * 
 * Headers:
 * - X-Shopify-Hmac-SHA256: string (required) - Webhook signature for verification
 * - X-Shopify-Shop-Domain: string - Shop domain
 * - X-Shopify-Topic: string - Webhook topic (should be 'orders/paid')
 */
router.post('/order-paid', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['x-shopify-hmac-sha256'];
    const rawBody = req.body;
    const isMockMode = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1';

    // Verify webhook signature (skip in mock mode)
    if (!isMockMode) {
      if (!signature) {
        return res.status(401).json({
          error: 'Missing webhook signature',
          timestamp: new Date().toISOString()
        });
      }

      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid webhook signature',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Parse the webhook payload
    const orderData = JSON.parse(rawBody.toString());

    // Process the order
    await processOrderPaid(orderData);

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      order_id: orderData.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Log error but still return 200 to prevent Shopify from retrying
    console.error('Error processing webhook:', error);
    res.status(200).json({
      success: false,
      error: 'Webhook received but processing failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

