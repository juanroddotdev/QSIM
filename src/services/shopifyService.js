const axios = require('axios');
const mockService = require('./mockShopifyService');
const { getAccessToken, getShopName, hasAccessToken } = require('../utils/oauthToken');

// Check if mock mode is enabled (only if OAuth token is not available)
const isMockMode = (process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1') && !hasAccessToken();

/**
 * Get Shopify Admin API base URL
 */
function getShopifyApiUrl() {
  // Prefer OAuth shop name, fall back to env variable
  const shopName = getShopName() || process.env.SHOP_NAME;
  if (!shopName) {
    throw new Error('SHOP_NAME environment variable is required or app must be authorized via OAuth');
  }
  return `https://${shopName}.myshopify.com/admin/api/2024-01`;
}

/**
 * Get Shopify API headers with authentication
 */
function getShopifyHeaders() {
  // Prefer OAuth access token, fall back to env API_KEY
  const accessToken = getAccessToken() || process.env.API_KEY;
  
  if (!accessToken) {
    if (hasAccessToken()) {
      throw new Error('OAuth token expired or invalid. Please re-authorize at /auth/install');
    }
    throw new Error('API_KEY environment variable is required or app must be authorized via OAuth');
  }
  
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken
  };
}

/**
 * Find product variant by SKU
 * @param {string} sku - The SKU to search for
 * @returns {Promise<Object>} The variant object
 */
async function findVariantBySku(sku) {
  // Use mock service if in mock mode
  if (isMockMode) {
    console.log('[MOCK MODE] Finding variant by SKU:', sku);
    return mockService.findVariantBySku(sku);
  }

  const apiUrl = getShopifyApiUrl();
  const headers = getShopifyHeaders();

  try {
    // Search for products and variants by SKU
    // Note: This is a simplified approach. In production, you might want to use
    // GraphQL Admin API or maintain a SKU-to-variant mapping
    const searchUrl = `${apiUrl}/products.json?limit=250`;
    let allProducts = [];
    let hasNextPage = true;
    let pageInfo = null;

    while (hasNextPage) {
      const response = await axios.get(searchUrl + (pageInfo ? `&page_info=${pageInfo}` : ''), {
        headers
      });

      allProducts = allProducts.concat(response.data.products);

      // Check for pagination
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<[^>]+page_info=([^>]+)>/);
        pageInfo = nextMatch ? nextMatch[1] : null;
        hasNextPage = !!pageInfo;
      } else {
        hasNextPage = false;
      }
    }

    // Find the variant with matching SKU
    for (const product of allProducts) {
      for (const variant of product.variants) {
        if (variant.sku === sku) {
          return { product, variant };
        }
      }
    }

    throw new Error(`Variant with SKU "${sku}" not found`);
  } catch (error) {
    if (error.response) {
      throw new Error(`Shopify API error: ${error.response.status} - ${error.response.statusText}`);
    }
    throw error;
  }
}

/**
 * Bind a barcode to a product variant
 * @param {string} sku - The SKU of the product variant
 * @param {string} scannedBarcode - The barcode to bind
 * @returns {Promise<Object>} The updated variant
 */
async function bindBarcode(sku, scannedBarcode) {
  // Use mock service if in mock mode
  if (isMockMode) {
    console.log('[MOCK MODE] Binding barcode:', { sku, scannedBarcode });
    return mockService.bindBarcode(sku, scannedBarcode);
  }

  try {
    // Find the variant by SKU
    const { product, variant } = await findVariantBySku(sku);

    const apiUrl = getShopifyApiUrl();
    const headers = getShopifyHeaders();

    // Update the variant with the new barcode
    const updateUrl = `${apiUrl}/products/${product.id}/variants/${variant.id}.json`;
    
    const updatePayload = {
      variant: {
        id: variant.id,
        barcode: scannedBarcode
      }
    };

    const response = await axios.put(updateUrl, updatePayload, { headers });

    return {
      variant_id: response.data.variant.id,
      product_id: response.data.variant.product_id,
      sku: response.data.variant.sku,
      barcode: response.data.variant.barcode
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.errors || error.response.statusText;
      throw new Error(`Shopify API error (${status}): ${JSON.stringify(message)}`);
    }
    throw error;
  }
}

module.exports = {
  bindBarcode,
  findVariantBySku,
  getShopifyApiUrl,
  getShopifyHeaders
};

