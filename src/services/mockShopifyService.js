/**
 * Mock Shopify Service
 * Simulates Shopify API responses for testing without actual credentials
 */

// In-memory mock data store
const mockProducts = {
  'PRODUCT-001': {
    id: 1001,
    title: 'Sample Product 1',
    variants: [
      {
        id: 2001,
        product_id: 1001,
        sku: 'PRODUCT-001',
        barcode: null,
        price: '29.99'
      }
    ]
  },
  'FAB-001': {
    id: 1002,
    title: 'Fabric Product 1',
    variants: [
      {
        id: 2002,
        product_id: 1002,
        sku: 'FAB-001',
        barcode: '1234567890123',
        price: '49.99'
      }
    ]
  },
  'FAB-002': {
    id: 1003,
    title: 'Fabric Product 2',
    variants: [
      {
        id: 2003,
        product_id: 1003,
        sku: 'FAB-002',
        barcode: null,
        price: '59.99'
      }
    ]
  }
};

/**
 * Mock: Find product variant by SKU
 * @param {string} sku - The SKU to search for
 * @returns {Promise<Object>} The variant object
 */
async function findVariantBySku(sku) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const product = mockProducts[sku];
  
  if (!product) {
    throw new Error(`Variant with SKU "${sku}" not found`);
  }

  return {
    product: {
      id: product.id,
      title: product.title
    },
    variant: product.variants[0]
  };
}

/**
 * Mock: Bind a barcode to a product variant
 * @param {string} sku - The SKU of the product variant
 * @param {string} scannedBarcode - The barcode to bind
 * @returns {Promise<Object>} The updated variant
 */
async function bindBarcode(sku, scannedBarcode) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));

  const product = mockProducts[sku];
  
  if (!product) {
    throw new Error(`Variant with SKU "${sku}" not found`);
  }

  // Update the barcode in mock data
  product.variants[0].barcode = scannedBarcode;

  console.log(`[MOCK] Updated barcode for SKU ${sku}: ${scannedBarcode}`);

  return {
    variant_id: product.variants[0].id,
    product_id: product.id,
    sku: product.variants[0].sku,
    barcode: scannedBarcode
  };
}

/**
 * Get all mock products (for testing/debugging)
 */
function getMockProducts() {
  return mockProducts;
}

module.exports = {
  bindBarcode,
  findVariantBySku,
  getMockProducts
};

