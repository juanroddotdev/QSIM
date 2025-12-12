/**
 * Simple in-memory storage for OAuth access token
 * In production, this should be stored in a database or secure storage
 */

let accessToken = null;
let shopName = null;

/**
 * Store OAuth access token
 * @param {string} token - The access token
 * @param {string} shop - The shop name
 */
function setAccessToken(token, shop) {
  accessToken = token;
  shopName = shop;
  console.log(`[OAuth] Access token stored for shop: ${shop}`);
}

/**
 * Get stored OAuth access token
 * @returns {string|null} The access token or null if not set
 */
function getAccessToken() {
  return accessToken;
}

/**
 * Get stored shop name
 * @returns {string|null} The shop name or null if not set
 */
function getShopName() {
  return shopName;
}

/**
 * Check if OAuth token is available
 * @returns {boolean} True if token is available
 */
function hasAccessToken() {
  return accessToken !== null;
}

/**
 * Clear stored access token (for testing/logout)
 */
function clearAccessToken() {
  accessToken = null;
  shopName = null;
  console.log('[OAuth] Access token cleared');
}

module.exports = {
  setAccessToken,
  getAccessToken,
  getShopName,
  hasAccessToken,
  clearAccessToken
};

