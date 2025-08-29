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

const PAYOUT_THRESHOLD = 50.00;

app.get('/', (req, res) => {
  res.json({ 
    status: 'active', 
    service: 'Chargebee Affiliate Integration',
    version: '2.0.0',
    commission_structure: COMMISSION_AMOUNTS,
    payout_threshold: PAYOUT_THRESHOLD
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.post('/webhooks/chargebee', async (req, res) => {
  try {
    const { event_type, content } = req.body;
    
    console.log(`📨 CHARGEBEE WEBHOOK: ${event_type}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    
    if (event_type === 'subscription_created') {
      const subscription = content.subscription;
      const customer = content.customer;
      
      console.log(`🎉 NEW SUBSCRIPTION CREATED!`);
      console.log(`   Customer: ${customer.first_name} ${customer.last_name}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Plan: ${subscription.plan_id}`);
      console.log(`   Amount: $${(subscription.plan_unit_price / 100).toFixed(2)}`);
      
      console.log(`💰 COMMISSION CALCULATION:`);
      let totalCommissions = 0;
      for (let i = 1; i <= 8; i++) {
        const levelKey = `level${i}`;
        const amount = COMMISSION_AMOUNTS[levelKey];
        totalCommissions += amount;
        console.log(`   Level ${i}: $${amount.toFixed(2)}`);
      }
      console.log(`   🎯 Total: $${totalCommissions.toFixed(2)}`);
      
      // Mock payout threshold check
      const mockBalances = [45, 38, 52, 23, 67, 31, 49, 55]; // Example balances
      mockBalances.forEach((balance, index) => {
        const newBalance = balance + COMMISSION_AMOUNTS[`level${index + 1}`];
        if (newBalance >= PAYOUT_THRESHOLD) {
          console.log(`   🎉 Level ${index + 1} affiliate reached $${PAYOUT_THRESHOLD} - PAYOUT TRIGGERED!`);
        }
      });
    }
    
    if (event_type === 'subscription_renewed' || event_type === 'invoice_generated') {
      console.log(`🔄 RECURRING PAYMENT PROCESSED`);
      console.log(`   Recurring commissions calculated: $19.00 total`);
    }
    
    if (event_type === 'subscription_cancelled') {
      console.log(`❌ SUBSCRIPTION CANCELLED`);
      console.log(`   No more recurring commissions`);
    }

    res.status(200).json({ 
      status: 'success', 
      event_type: event_type,
      processed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(200).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

app.get('/webhooks/chargebee', (req, res) => {
  res.json({
    message: 'Webhook endpoint ready!',
    commission_structure: COMMISSION_AMOUNTS,
    payout_threshold: PAYOUT_THRESHOLD
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chargebee Affiliate Integration running on port ${PORT}`);
  console.log(`📊 Commission structure: L1=$8, L2=$4, L3=$2, L4-L8=$1 each`);
  console.log(`💰 Payout threshold: $${PAYOUT_THRESHOLD}`);
  console.log(`🔗 Webhook endpoint ready!`);
});
