const { deductInventory } = require('../utils/inventory');

/**
 * Process an order/paid webhook event
 * @param {Object} orderData - The order data from Shopify webhook
 */
async function processOrderPaid(orderData) {
  const orderId = orderData.id;
  const lineItems = orderData.line_items || [];

  console.log(`Processing order/paid webhook for order ID: ${orderId}`);

  // Process each line item
  for (const lineItem of lineItems) {
    const sku = lineItem.sku;
    const quantity = lineItem.quantity;

    if (!sku) {
      console.warn(`Line item ${lineItem.id} has no SKU, skipping`);
      continue;
    }

    // Check if SKU starts with 'FAB-' (fabric product)
    if (sku.startsWith('FAB-')) {
      console.log(`Deducting inventory for fabric product: SKU=${sku}, Quantity=${quantity}`);
      
      try {
        await deductInventory(sku, quantity);
        console.log(`Successfully deducted inventory for SKU: ${sku}`);
      } catch (error) {
        console.error(`Error deducting inventory for SKU ${sku}:`, error.message);
        // Continue processing other items even if one fails
      }
    } else {
      console.log(`Skipping non-fabric product: SKU=${sku}`);
    }
  }

  console.log(`Finished processing order ${orderId}`);
}

module.exports = {
  processOrderPaid
};

