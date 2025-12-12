const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { setAccessToken } = require('../utils/oauthToken');

/**
 * GET /auth/install
 * Initiates OAuth flow by redirecting to Shopify authorization page
 */
router.get('/install', (req, res) => {
  const shopName = process.env.SHOP_NAME;
  const clientId = process.env.CLIENT_ID;

  if (!shopName || !clientId) {
    return res.status(400).json({
      error: 'Missing SHOP_NAME or CLIENT_ID in environment variables',
      timestamp: new Date().toISOString()
    });
  }

  // Required scopes for the app
  const scopes = 'read_products,write_products';
  
  // Generate a random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state in cookie (for POC)
  // In production, use proper session management
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    maxAge: 300000, // 5 minutes
    sameSite: 'lax', // Allow cross-site for OAuth redirect
    secure: false // Set to true in production with HTTPS
  });

  // Build authorization URL
  // Allow override via environment variable (useful for ngrok/tunnels)
  const redirectUri = process.env.OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/callback`;
  const authUrl = `https://${shopName}.myshopify.com/admin/oauth/authorize?` +
    `client_id=${clientId}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`;
  
  console.log(`[OAuth] Using redirect URI: ${redirectUri}`);

  console.log(`[OAuth] Redirecting to: ${authUrl}`);
  res.redirect(authUrl);
});

/**
 * GET /auth/callback
 * Handles OAuth callback from Shopify and exchanges code for access token
 */
router.get('/callback', async (req, res) => {
  const { code, shop, state } = req.query;
  const storedState = req.cookies?.oauth_state;

  // Verify state to prevent CSRF attacks
  // For development, we'll be more lenient - log a warning but continue
  if (!state) {
    console.warn('[OAuth] Warning: No state parameter in callback');
  } else if (storedState && state !== storedState) {
    console.warn('[OAuth] Warning: State mismatch. Stored:', storedState, 'Received:', state);
    // In production, this should be an error, but for POC we'll continue
  }
  
  // If no stored state but we have a state in query, continue (cookie might have expired)
  if (!storedState && state) {
    console.warn('[OAuth] Warning: No stored state cookie, but state in query. Continuing...');
  }

  // Clear the state cookie
  res.clearCookie('oauth_state');

  if (!code || !shop) {
    return res.status(400).json({
      error: 'Missing code or shop parameter',
      timestamp: new Date().toISOString()
    });
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Missing CLIENT_ID or CLIENT_SECRET in environment variables',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    
    const response = await axios.post(tokenUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    });

    const accessToken = response.data.access_token;
    const grantedScopes = response.data.scope || 'unknown';
    const shopDomain = shop.replace('.myshopify.com', '');
    
    console.log(`[OAuth] Granted scopes: ${grantedScopes}`);
    console.log(`[OAuth] Required scopes: read_products,write_products`);
    
    if (!grantedScopes.includes('read_products')) {
      console.warn('[OAuth] WARNING: read_products scope was not granted!');
    }

    // Store the access token
    setAccessToken(accessToken, shopDomain);

    console.log(`[OAuth] Successfully obtained access token for shop: ${shopDomain}`);

    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 { color: #95bf47; margin-top: 0; }
            .token { 
              background: #f5f5f5; 
              padding: 1rem; 
              border-radius: 4px; 
              font-family: monospace; 
              word-break: break-all;
              margin: 1rem 0;
            }
            .info { color: #666; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ OAuth Authorization Successful!</h1>
            <p>Your app has been authorized and the access token has been stored.</p>
            <div class="token">Shop: ${shopDomain}</div>
            <p class="info">You can now use the API endpoints. Set MOCK_MODE=false in .env to use real API calls.</p>
            <p class="info">You can close this window.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[OAuth] Error exchanging code for token:', error.response?.data || error.message);
    
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 { color: #d32f2f; margin-top: 0; }
            .error { color: #666; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ OAuth Authorization Failed</h1>
            <p class="error">${error.response?.data?.error || error.message}</p>
            <p class="error">Please try again or check your credentials.</p>
          </div>
        </body>
      </html>
    `);
  }
});

/**
 * GET /auth/status
 * Check OAuth authorization status and granted scopes
 */
router.get('/status', async (req, res) => {
  const { hasAccessToken, getShopName } = require('../utils/oauthToken');
  const { checkGrantedScopes } = require('../utils/checkScopes');
  
  const authorized = hasAccessToken();
  let scopes = null;
  
  if (authorized) {
    try {
      scopes = await checkGrantedScopes();
    } catch (error) {
      console.error('Error checking scopes:', error.message);
    }
  }
  
  res.status(200).json({
    authorized,
    shop: getShopName() || null,
    scopes: scopes ? {
      granted: scopes.granted,
      has_required: scopes.hasReadProducts && scopes.hasWriteProducts,
      missing: scopes.required.filter(s => !scopes.granted.includes(s))
    } : null,
    message: authorized 
      ? (scopes && scopes.hasReadProducts && scopes.hasWriteProducts
          ? 'App is authorized and ready to make API calls'
          : 'App is authorized but missing required scopes. Re-authorize to grant permissions.')
      : 'App is not authorized. Visit /auth/install to authorize',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

