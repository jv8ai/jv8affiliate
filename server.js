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

app.post('/webhooks/chargebee', (req, res) => {
  const event_type = req.body.event_type || 'unknown';
  console.log('📨 Chargebee webhook received:', event_type);
  
  // Mock commission calculation for demo
  if (event_type === 'subscription_created') {
    console.log('💰 New subscription - calculating commissions...');
    console.log('Commission amounts:', COMMISSION_AMOUNTS);
    console.log('Total payout for 8 levels: $19.00');
  }
  
  res.json({ 
    status: 'received',
    event_type: event_type,
    processed: true
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chargebee Affiliate Integration running on port ${PORT}`);
  console.log(`📊 Commission structure: L1=$${COMMISSION_AMOUNTS.level1}, L2=$${COMMISSION_AMOUNTS.level2}, L3=$${COMMISSION_AMOUNTS.level3}, L4-L8=$${COMMISSION_AMOUNTS.level4} each`);
  console.log(`💰 Payout threshold: $${PAYOUT_THRESHOLD}`);
  console.log(`🔗 Webhook endpoint: /webhooks/chargebee`);
  console.log(`⚙️  Chargebee configured: ${CHARGEBEE_API_KEY ? 'Yes' : 'No'}`);
});
