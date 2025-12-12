const axios = require('axios');
const { getAccessToken, getShopName } = require('./oauthToken');

/**
 * Check what scopes are actually granted for the current access token
 */
async function checkGrantedScopes() {
  const accessToken = getAccessToken();
  const shopName = getShopName();

  if (!accessToken || !shopName) {
    throw new Error('No access token available. Please authorize the app first.');
  }

  try {
    const url = `https://${shopName}.myshopify.com/admin/oauth/access_scopes.json`;
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    return {
      granted: response.data.access_scopes || [],
      required: ['read_products', 'write_products'],
      hasReadProducts: (response.data.access_scopes || []).includes('read_products'),
      hasWriteProducts: (response.data.access_scopes || []).includes('write_products')
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

module.exports = {
  checkGrantedScopes
};

