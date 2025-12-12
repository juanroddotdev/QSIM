const express = require('express');
const router = express.Router();
const { createMockProducts, checkExistingMockProducts } = require('../services/productCreator');
const { hasAccessToken } = require('../utils/oauthToken');

/**
 * GET /setup/check
 * Check if mock products already exist in the store
 */
router.get('/check', async (req, res, next) => {
  try {
    if (!hasAccessToken()) {
      return res.status(401).json({
        error: 'App not authorized. Visit /auth/install to authorize first.',
        timestamp: new Date().toISOString()
      });
    }

    const existing = await checkExistingMockProducts();

    res.status(200).json({
      success: true,
      message: 'Checked for existing mock products',
      existing_products: existing.products,
      found_count: existing.found,
      expected_skus: ['PRODUCT-001', 'FAB-001', 'FAB-002'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /setup/create-mock-products
 * Create mock products in the Shopify store
 */
router.post('/create-mock-products', async (req, res, next) => {
  try {
    if (!hasAccessToken()) {
      return res.status(401).json({
        error: 'App not authorized. Visit /auth/install to authorize first.',
        timestamp: new Date().toISOString()
      });
    }

    console.log('[Setup] Creating mock products in Shopify store...');
    const result = await createMockProducts();

    res.status(200).json({
      success: true,
      message: 'Mock products creation completed',
      summary: {
        total: result.total,
        successful: result.successful,
        failed: result.failed
      },
      results: result.results,
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

