const express = require('express');
const router = express.Router();
const { bindBarcode } = require('../services/shopifyService');

/**
 * POST /api/bind-barcode
 * Binds a scanned barcode to a product variant SKU
 * 
 * Body:
 * - sku: string (required) - The SKU of the product variant
 * - scanned_barcode: string (required) - The barcode to bind to the variant
 */
router.post('/bind-barcode', async (req, res, next) => {
  try {
    const { sku, scanned_barcode } = req.body;

    // Validate input
    if (!sku || !scanned_barcode) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['sku', 'scanned_barcode']
      });
    }

    if (typeof sku !== 'string' || typeof scanned_barcode !== 'string') {
      return res.status(400).json({
        error: 'Invalid field types',
        expected: { sku: 'string', scanned_barcode: 'string' }
      });
    }

    // Bind the barcode
    const result = await bindBarcode(sku, scanned_barcode);

    res.status(200).json({
      success: true,
      message: 'Barcode bound successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

