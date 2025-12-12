const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * POST /test/webhook
 * Test endpoint to simulate a Shopify order/paid webhook
 * Useful for testing without actual Shopify webhook setup
 * 
 * Body: Optional order data (will use default if not provided)
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    // Default test order data
    const defaultOrderData = {
      id: 1234567890,
      name: '#TEST-001',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      line_items: [
        {
          id: 1001,
          sku: 'FAB-001',
          title: 'Fabric Product 1',
          quantity: 2,
          price: '49.99'
        },
        {
          id: 1002,
          sku: 'PRODUCT-001',
          title: 'Regular Product',
          quantity: 1,
          price: '29.99'
        },
        {
          id: 1003,
          sku: 'FAB-002',
          title: 'Fabric Product 2',
          quantity: 3,
          price: '59.99'
        }
      ],
      total_price: '229.96',
      currency: 'USD'
    };

    const orderData = req.body && Object.keys(req.body).length > 0 
      ? req.body 
      : defaultOrderData;

    // Convert to JSON string for signature calculation
    const orderJson = JSON.stringify(orderData);
    const rawBody = Buffer.from(orderJson, 'utf8');

    // Generate a mock signature (in real scenario, Shopify would generate this)
    const webhookSecret = process.env.WEBHOOK_SECRET || 'test-secret';
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawBody, 'utf8');
    const signature = hmac.digest('base64');

    // Make internal call to webhook endpoint
    const webhookUrl = `${req.protocol}://${req.get('host')}/webhooks/order-paid`;
    
    console.log(`[TEST] Simulating webhook call to ${webhookUrl}`);
    console.log(`[TEST] Order ID: ${orderData.id}`);
    console.log(`[TEST] Line items: ${orderData.line_items.length}`);

    // Use axios to call the webhook endpoint
    const axios = require('axios');
    const response = await axios.post(webhookUrl, rawBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-SHA256': signature,
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
        'X-Shopify-Topic': 'orders/paid'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Test webhook sent successfully',
      order_data: orderData,
      webhook_response: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /test/mock-products
 * Get list of available mock products for testing
 */
router.get('/mock-products', (req, res) => {
  const mockService = require('../services/mockShopifyService');
  const products = mockService.getMockProducts();
  
  res.status(200).json({
    success: true,
    message: 'Mock products available for testing',
    products: products,
    available_skus: Object.keys(products),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

