const axios = require('axios');
const { getShopifyApiUrl, getShopifyHeaders } = require('./shopifyService');

/**
 * Create a product in Shopify
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
async function createProduct(productData) {
  const apiUrl = getShopifyApiUrl();
  const headers = getShopifyHeaders();

  try {
    const response = await axios.post(
      `${apiUrl}/products.json`,
      { product: productData },
      { headers }
    );

    return response.data.product;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.errors || error.response.statusText;
      throw new Error(`Shopify API error (${status}): ${JSON.stringify(message)}`);
    }
    throw error;
  }
}

/**
 * Create mock products in Shopify store
 * Creates the same products we have in mock data
 */
async function createMockProducts() {
  const mockProducts = [
    {
      title: 'Sample Product 1',
      body_html: '<p>This is a sample product for testing barcode binding.</p>',
      vendor: 'Test Vendor',
      product_type: 'Test Product',
      variants: [
        {
          sku: 'PRODUCT-001',
          price: '29.99',
          inventory_management: 'shopify',
          inventory_quantity: 100
        }
      ]
    },
    {
      title: 'Fabric Product 1',
      body_html: '<p>This is a fabric product for testing inventory deduction.</p>',
      vendor: 'Test Vendor',
      product_type: 'Fabric',
      variants: [
        {
          sku: 'FAB-001',
          price: '49.99',
          barcode: '1234567890123',
          inventory_management: 'shopify',
          inventory_quantity: 50
        }
      ]
    },
    {
      title: 'Fabric Product 2',
      body_html: '<p>This is another fabric product for testing inventory deduction.</p>',
      vendor: 'Test Vendor',
      product_type: 'Fabric',
      variants: [
        {
          sku: 'FAB-002',
          price: '59.99',
          inventory_management: 'shopify',
          inventory_quantity: 75
        }
      ]
    }
  ];

  const results = [];
  const errors = [];

  for (const productData of mockProducts) {
    try {
      console.log(`Creating product: ${productData.title} (SKU: ${productData.variants[0].sku})`);
      const product = await createProduct(productData);
      results.push({
        success: true,
        product: {
          id: product.id,
          title: product.title,
          sku: product.variants[0]?.sku,
          variant_id: product.variants[0]?.id
        }
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error creating product ${productData.title}:`, error.message);
      errors.push({
        success: false,
        product_title: productData.title,
        sku: productData.variants[0]?.sku,
        error: error.message
      });
    }
  }

  return {
    total: mockProducts.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors
  };
}

/**
 * Check if products with mock SKUs already exist
 * @returns {Promise<Object>} Existing products info
 */
async function checkExistingMockProducts() {
  const apiUrl = getShopifyApiUrl();
  const headers = getShopifyHeaders();
  const targetSkus = ['PRODUCT-001', 'FAB-001', 'FAB-002'];

  try {
    // Search for products (simplified - in production, use GraphQL for better SKU search)
    const response = await axios.get(
      `${apiUrl}/products.json?limit=250`,
      { headers }
    );
    
    console.log(`[ProductCreator] Found ${response.data.products.length} products in store`);

    const existingProducts = [];
    for (const product of response.data.products) {
      for (const variant of product.variants) {
        if (targetSkus.includes(variant.sku)) {
          existingProducts.push({
            product_id: product.id,
            product_title: product.title,
            variant_id: variant.id,
            sku: variant.sku,
            barcode: variant.barcode || null
          });
        }
      }
    }

    return {
      found: existingProducts.length,
      products: existingProducts
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      const errorData = error.response.data;
      console.error(`[ProductCreator] API Error:`, {
        status,
        statusText,
        data: errorData
      });
      throw new Error(`Shopify API error: ${status} - ${statusText}. ${errorData?.errors ? JSON.stringify(errorData.errors) : ''}`);
    }
    throw error;
  }
}

module.exports = {
  createMockProducts,
  checkExistingMockProducts,
  createProduct
};

