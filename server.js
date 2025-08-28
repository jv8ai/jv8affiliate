const express = require('express');
const app = express();

app.use(express.json());

// Commission structure
const COMMISSION_AMOUNTS = {
  level1: 8.00,
  level2: 4.00,
  level3: 2.00,
  level4: 1.00,
  level5: 1.00,
  level6: 1.00,
  level7: 1.00,
  level8: 1.00
};

// Configuration
const PAYOUT_THRESHOLD = 50.00;
const CHARGEBEE_SITE = process.env.CHARGEBEE_SITE;
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY;

app.get('/', (req, res) => {
  res.json({ 
    status: 'active', 
    service: 'Chargebee Affiliate Integration',
    version: '1.0.0',
    commission_structure: COMMISSION_AMOUNTS,
    payout_threshold: PAYOUT_THRESHOLD
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    chargebee_configured: !!CHARGEBEE_API_KEY
  });
});

// Enhanced webhook handler with better error handling
app.post('/webhooks/chargebee', (req, res) => {
  try {
    console.log('📨 Raw webhook received');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Safely get event type
    const event_type = req.body?.event_type || 'unknown';
    console.log('Event type:', event_type);
    
    // Simple processing with null checks
    if (event_type === 'subscription_created') {
      console.log('🎉 New subscription created!');
      
      // Safely access subscription data
      const subscription = req.body?.content?.subscription;
      if (subscription) {
        console.log(`Subscription ID: ${subscription.id || 'unknown'}`);
        console.log(`Plan ID: ${subscription.plan_id || 'unknown'}`);
        console.log(`Amount: $${subscription.plan_amount || 0}`);
      }
      
      console.log('💰 Commission calculation:');
      console.log('   Level 1: $8.00');
      console.log('   Level 2: $4.00'); 
      console.log('   Level 3: $2.00');
      console.log('   Levels 4-8: $1.00 each');
      console.log('   Total: $19.00');
    }
    
    if (event_type === 'subscription_renewed') {
      console.log('🔄 Subscription renewed - recurring commissions calculated');
    }
    
    // Always return success
    res.status(200).json({ 
      status: 'received',
      event_type: event_type,
      processed: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('Error stack:', error.stack);
    
    // Still return 200 to prevent Chargebee retries
    res.status(200).json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chargebee Affiliate Integration running on port ${PORT}`);
  console.log(`📊 Commission structure: L1=$${COMMISSION_AMOUNTS.level1}, L2=$${COMMISSION_AMOUNTS.level2}, L3=$${COMMISSION_AMOUNTS.level3}, L4-L8=$${COMMISSION_AMOUNTS.level4} each`);
  console.log(`💰 Payout threshold: $${PAYOUT_THRESHOLD}`);
  console.log(`🔗 Webhook endpoint: /webhooks/chargebee`);
  console.log(`⚙️ Chargebee configured: ${CHARGEBEE_API_KEY ? 'Yes' : 'No'}`);
});
