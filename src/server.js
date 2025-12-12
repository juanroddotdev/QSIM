require('dotenv').config();
const express = require('express');
const barcodeRoutes = require('./routes/barcode');
const webhookRoutes = require('./routes/webhooks');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 3000;

// Request logging middleware (before body parsing)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Body parsing middleware - apply JSON parsing only to non-webhook routes
// Webhook routes need raw body for signature verification
app.use((req, res, next) => {
  if (req.path.startsWith('/webhooks')) {
    // Skip JSON parsing for webhook routes - they handle raw body themselves
    return next();
  }
  // Apply JSON parsing for all other routes
  return express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', barcodeRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/test', testRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1') {
    console.log('⚠️  MOCK MODE ENABLED - Using mock Shopify services');
    console.log('   Test endpoints available at /test/webhook and /test/mock-products');
  }
});

module.exports = app;

