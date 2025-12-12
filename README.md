# Shopify Private App Proof of Concept

A minimal, secure Node.js (Express) application for Shopify Private App integration, handling barcode binding and webhook-triggered inventory deduction.

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
   
   **For Production (with Shopify credentials):**
   ```
   MOCK_MODE=false
   SHOP_NAME=your-shop-name
   API_KEY=your-shopify-private-app-api-key
   WEBHOOK_SECRET=your-webhook-shared-secret
   PORT=3000
   NODE_ENV=development
   ```

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

## Shopify Configuration

### Private App Setup

1. In your Shopify admin, go to **Settings > Apps and sales channels**
2. Click **Develop apps** > **Create an app**
3. Configure Admin API access scopes:
   - `read_products`
   - `write_products`
4. Install the app and copy the **Admin API access token** to `API_KEY` in `.env`

### Webhook Configuration

1. In your Shopify admin, go to **Settings > Notifications**
2. Scroll to **Webhooks** section
3. Click **Create webhook**
4. Configure:
   - **Event**: Order paid
   - **Format**: JSON
   - **URL**: `https://your-domain.com/webhooks/order-paid`
   - Copy the **Signing secret** to `WEBHOOK_SECRET` in `.env`

## Mock Mode

The application includes a **mock mode** that allows you to test the proof of concept without Shopify credentials. When `MOCK_MODE=true`:

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
