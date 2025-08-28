const express = require('express');
const crypto = require('crypto');
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
const CHARGEBEE_WEBHOOK_SECRET = process.env.CHARGEBEE_WEBHOOK_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

class AffiliateProcessor {
  // Mock affiliate hierarchy for testing
  async getAffiliateHierarchy(affiliateId) {
    console.log(`🔍 Looking up affiliate hierarchy for: ${affiliateId}`);
    
    // Return mock 8-level hierarchy
    const hierarchy = [
      { id: 'affiliate-1', level: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 'affiliate-2', level: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'affiliate-3', level: 3, name: 'Mike Johnson', email: 'mike@example.com' },
      { id: 'affiliate-4', level: 4, name: 'Sarah Wilson', email: 'sarah@example.com' },
      { id: 'affiliate-5', level: 5, name: 'Tom Brown', email: 'tom@example.com' },
      { id: 'affiliate-6', level: 6, name: 'Lisa Davis', email: 'lisa@example.com' },
      { id: 'affiliate-7', level: 7, name: 'Chris Miller', email: 'chris@example.com' },
      { id: 'affiliate-8', level: 8, name: 'Amy Taylor', email: 'amy@example.com' }
    ];
    
    return hierarchy;
  }

  async calculateCommissions(subscription, affiliateHierarchy, type, amount) {
    const commissions = [];
    let totalCommissions = 0;

    console.log(`💰 Calculating ${type} commissions for ${affiliateHierarchy.length} levels`);

    for (const affiliate of affiliateHierarchy) {
      const levelKey = `level${affiliate.level}`;
      const commissionAmount = COMMISSION_AMOUNTS[levelKey];
      
      if (commissionAmount) {
        const commission = {
          affiliate_id: affiliate.id,
          affiliate_name: affiliate.name,
          subscription_id: subscription.id,
          level: affiliate.level,
          type: type,
          amount: commissionAmount,
          base_amount: amount,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        
        commissions.push(commission);
        totalCommissions += commissionAmount;
        
        console.log(`   L${affiliate.level}: ${affiliate.name} → $${commissionAmount}`);
      }
    }

    console.log(`   📊 Total commissions: $${totalCommissions}`);
    
    // Check for payout threshold
    for (const commission of commissions) {
      await this.checkPayoutThreshold(commission.affiliate_id, commission.affiliate_name);
    }

    return commissions;
  }

  async checkPayoutThreshold(affiliateId, affiliateName) {
    // Mock current balance - in production, this would query your database
    const mockBalance = Math.floor(Math.random() * 100); // Random balance for demo
    
    console.log(`💳 ${affiliateName} current balance: $${mockBalance}`);
    
    if (mockBalance >= PAYOUT_THRESHOLD) {
      console.log(`🎉 PAYOUT TRIGGERED! ${affiliateName} reached $${PAYOUT_THRESHOLD} threshold`);
      console.log(`   💸 Processing instant payout of $${mockBalance}...`);
      // In production, this would trigger the actual payout
    }
  }
}

const processor = new AffiliateProcessor();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'active', 
    service: 'Chargebee Affiliate Integration',
    version: '1.0.0',
    commission_structure: COMMISSION_AMOUNTS,
    payout_threshold: PAYOUT_THRESHOLD,
    features: [
      '8-level commission tracking',
      'Instant payouts at $50',
      'Chargebee webhook integration',
      'Stripe payout processing'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    chargebee_configured: !!CHARGEBEE_API_KEY,
    stripe_configured: !!STRIPE_SECRET_KEY,
    webhook_secret_configured: !!CHARGEBEE_WEBHOOK_SECRET
  });
});

// Webhook signature verification
function verifyWebhookSignature(payload, signature) {
  if (!signature || !CHARGEBEE_WEBHOOK_SECRET) {
    console.log('⚠️  Webhook signature verification skipped (no secret configured)');
    return true; // Skip verification in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', CHARGEBEE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Main webhook handler
app.post('/webhooks/chargebee', async (req, res) => {
  try {
    const signature = req.headers['chargebee-webhook-signature'];
    const payload = JSON.stringify(req.body);

    // Verify signature (optional in development)
    if (!verifyWebhookSignature(payload, signature)) {
      console.log('❌ Invalid webhook signature');
