# Shopify Private App Proof of Concept

A minimal, secure Node.js (Express) application for Shopify Private App integration, handling barcode binding and webhook-triggered inventory deduction.

## Documentation

- [System Architecture](./docs/ARCHITECTURE.md) - Overall system architecture
- [Data Flow](./docs/DATA_FLOW.md) - Data flow through the application
- [User Workflow](./docs/USER_WORKFLOW.md) - User workflow diagrams

To view diagrams locally, open [`docs/index.html`](./docs/index.html) in your browser.

## Features

- **Barcode Binding**: POST endpoint to bind scanned barcodes to product variants via Shopify Admin API
- **Webhook Processing**: Secure webhook listener for `order/paid` events with HMAC signature verification
- **Inventory Deduction**: Placeholder function for fabric product (FAB-*) inventory deduction

## Prerequisites

- Node.js 18+ 
- (Optional) A Shopify store with Private App access and credentials (if not using mock mode)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   **For Mock Mode (Testing without Shopify credentials):**
   ```
   MOCK_MODE=true
   PORT=3000
   NODE_ENV=development
   ```
   
   **For Production (with Shopify Custom App - OAuth):**
   ```
   MOCK_MODE=false
   SHOP_NAME=your-shop-name
   CLIENT_ID=your-shopify-app-client-id
   CLIENT_SECRET=your-shopify-app-client-secret
   WEBHOOK_SECRET=your-client-secret-here
   PORT=3000
   NODE_ENV=development
   ```
   
   **Note:** After setting up credentials, visit `/auth/install` to authorize the app via OAuth.

3. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST `/api/bind-barcode`

Binds a scanned barcode to a product variant.

**Request Body:**
```json
{
  "sku": "PRODUCT-SKU-123",
  "scanned_barcode": "1234567890123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Barcode bound successfully",
  "data": {
    "variant_id": 123456789,
    "product_id": 987654321,
    "sku": "PRODUCT-SKU-123",
    "barcode": "1234567890123"
  }
}
```

### POST `/webhooks/order-paid`

Receives and processes Shopify `order/paid` webhook events.

**Headers:**
- `X-Shopify-Hmac-SHA256`: Webhook signature (required)

**Behavior:**
- Verifies webhook signature using shared secret
- Logs order ID
- Processes line items with SKU starting with `FAB-`
- Calls `deductInventory()` for fabric products
- Always returns 200 OK to acknowledge receipt

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST `/test/webhook`

Test endpoint to simulate a Shopify `order/paid` webhook (useful for testing without actual webhook setup).

**Request Body (optional):**
```json
{
  "id": 1234567890,
  "name": "#TEST-001",
  "line_items": [
    {
      "id": 1001,
      "sku": "FAB-001",
      "quantity": 2
    }
  ]
}
```

If no body is provided, uses default test data with fabric products.

**Response:**
```json
{
  "success": true,
  "message": "Test webhook sent successfully",
  "order_data": { ... },
  "webhook_response": { ... }
}
```

### GET `/test/mock-products`

Get list of available mock products for testing (mock mode only).

**Response:**
```json
{
  "success": true,
  "products": { ... },
  "available_skus": ["PRODUCT-001", "FAB-001", "FAB-002"]
}
```

### GET `/auth/install`

Initiates OAuth flow to authorize the app with Shopify. Redirects to Shopify's authorization page.

**Usage:**
1. Visit `http://localhost:3000/auth/install` in your browser
2. You'll be redirected to Shopify to authorize the app
3. After authorization, you'll be redirected back and the access token will be stored

### GET `/auth/callback`

OAuth callback endpoint (handled automatically by Shopify after authorization).

### GET `/auth/status`

Check OAuth authorization status.

**Response:**
```json
{
  "authorized": true,
  "shop": "test-quilt-shop",
  "message": "App is authorized and ready to make API calls"
}
```

## Shopify Configuration

### Custom App Setup (OAuth - Recommended)

1. In your Shopify Dev Dashboard, create a new app
2. Configure Admin API scopes:
   - `read_products`
   - `write_products`
3. Copy the **Client ID** and **Client Secret** to your `.env` file
4. Set `MOCK_MODE=false` in `.env`
5. Start the server: `npm start`
6. Visit `http://localhost:3000/auth/install` to authorize the app
7. After authorization, the app will automatically use the OAuth access token for API calls

### Legacy Private App Setup (Alternative)

If you have a legacy Private App with direct API key:
1. Copy the **Admin API access token** to `API_KEY` in `.env`
2. Set `MOCK_MODE=false`
3. No OAuth flow needed

### Webhook Configuration

1. In your Shopify admin, go to **Settings > Notifications**
2. Scroll to **Webhooks** section
3. Click **Create webhook**
4. Configure:
   - **Event**: Order paid
   - **Format**: JSON
   - **URL**: `https://your-domain.com/webhooks/order-paid`
   - Copy the **Signing secret** to `WEBHOOK_SECRET` in `.env`

## OAuth Authentication

The application supports OAuth authentication for Shopify Custom Apps:

1. **Set up credentials** in `.env` (CLIENT_ID, CLIENT_SECRET, SHOP_NAME)
2. **Start the server**: `npm start`
3. **Authorize the app**: Visit `http://localhost:3000/auth/install`
4. **Check status**: Visit `http://localhost:3000/auth/status`

Once authorized, the app automatically uses the OAuth access token for all API calls. Mock mode is automatically disabled when an OAuth token is available.

## Mock Mode

The application includes a **mock mode** that allows you to test the proof of concept without Shopify credentials. When `MOCK_MODE=true` and no OAuth token is available:

- **Barcode Binding**: Uses in-memory mock product data
- **Webhook Verification**: Signature verification is skipped
- **Test Endpoints**: Additional test endpoints are available at `/test/*`
- **Mock Products**: Pre-configured products with SKUs: `PRODUCT-001`, `FAB-001`, `FAB-002`

**To test the proof of concept:**

1. Set `MOCK_MODE=true` in `.env`
2. Start the server: `npm start`
3. Test barcode binding:
   ```bash
   curl -X POST http://localhost:3000/api/bind-barcode \
     -H "Content-Type: application/json" \
     -d '{"sku": "PRODUCT-001", "scanned_barcode": "1234567890123"}'
   ```
4. Test webhook processing:
   ```bash
   curl -X POST http://localhost:3000/test/webhook
   ```
5. View available mock products:
   ```bash
   curl http://localhost:3000/test/mock-products
   ```

## Security Features

- **Webhook Signature Verification**: All webhooks are verified using HMAC-SHA256 (skipped in mock mode)
- **Environment Variables**: Sensitive credentials stored in `.env` (not committed)
- **Error Handling**: Graceful error handling with appropriate HTTP status codes
- **Input Validation**: Request validation for required fields and types

## Project Structure

```
QSIM/
├── src/
│   ├── server.js              # Express app entry point
│   ├── routes/
│   │   ├── barcode.js         # Barcode binding routes
│   │   ├── webhooks.js        # Webhook routes
│   │   └── test.js            # Test endpoints for mock mode
│   ├── services/
│   │   ├── shopifyService.js  # Shopify API integration
│   │   ├── mockShopifyService.js  # Mock Shopify service (mock mode)
│   │   └── webhookService.js  # Webhook processing logic
│   └── utils/
│       ├── webhookVerification.js  # HMAC signature verification
│       └── inventory.js       # Inventory deduction placeholder
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Development Notes

- **No Official Shopify Library**: Uses `axios` for HTTP requests to keep dependencies minimal
- **Placeholder Functions**: `deductInventory()` is a placeholder that should be replaced with actual inventory management logic
- **Error Handling**: Webhook errors are logged but still return 200 OK to prevent Shopify retries
- **Pagination**: Product search handles pagination for stores with many products

## Next Steps

1. Replace `deductInventory()` placeholder with actual inventory management logic
2. Add database persistence for barcode bindings (optional)
3. Implement retry logic for failed API calls
4. Add comprehensive logging and monitoring
5. Implement rate limiting for API endpoints
6. Add unit and integration tests

## License

ISC
