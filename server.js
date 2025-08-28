// Chargebee Integration for 8-Level Affiliate Commission Tracking
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

// Configuration - use environment variables
const CHARGEBEE_SITE = process.env.CHARGEBEE_SITE || 'jv8ai-test';
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY;
const CHARGEBEE_WEBHOOK_SECRET = process.env.CHARGEBEE_WEBHOOK_SECRET;
const BASE44_API_URL = process.env.BASE44_API_URL;
const BASE44_API_KEY = process.env.BASE44_API_KEY;

// Payout configuration
const PAYOUT_THRESHOLD = 50.00; // $50 minimum for instant payout
const DEFAULT_PAYOUT_PROVIDER = 'stripe'; // Default: 'stripe', 'paypal', or 'manual'

// Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

// Commission structure (8 levels) - Fixed dollar amounts
const COMMISSION_AMOUNTS = {
  level1: 8.00,   // $8
  level2: 4.00,   // $4
  level3: 2.00,   // $2
  level4: 1.00,   // $1
  level5: 1.00,   // $1
  level6: 1.00,   // $1
  level7: 1.00,   // $1
  level8: 1.00    // $1
};

class ChargebeeAffiliateIntegration {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
    this.setupWebhooks();
  }

  // Setup basic routes
  setupRoutes() {
    this.app.get('/', (req, res) => {
      res.json({ 
        status: 'active', 
        service: 'Chargebee Affiliate Integration',
        version: '1.0.0'
      });
    });

    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  // Setup webhook endpoints
  setupWebhooks() {
    this.app.post('/webhooks/chargebee', async (req, res) => {
      try {
        const signature = req.headers['chargebee-webhook-signature'];
        const payload = JSON.stringify(req.body);

        if (!this.verifyWebhookSignature(payload, signature)) {
          return res.status(401).json({ error: 'Invalid signature' });
        }

        await this.handleWebhookEvent(req.body);
        res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  // Verify Chargebee webhook signature
  verifyWebhookSignature(payload, signature) {
    if (!signature || !CHARGEBEE_WEBHOOK_SECRET) {
      return false;
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

  // Handle different webhook events
  async handleWebhookEvent(event) {
    const { event_type, content } = event;

    try {
      switch (event_type) {
        case 'subscription_created':
          await this.handleSubscriptionCreated(content.subscription, content.customer);
          break;
        
        case 'subscription_renewed':
        case 'invoice_generated':
          await this.handleRecurringPayment(content.subscription, content.invoice);
          break;
        
        case 'subscription_cancelled':
          await this.handleSubscriptionCancelled(content.subscription);
          break;
        
        case 'subscription_reactivated':
          await this.handleSubscriptionReactivated(content.subscription);
          break;

        default:
          console.log(`Unhandled event type: ${event_type}`);
      }
    } catch (error) {
      console.error(`Error handling ${event_type}:`, error);
    }
  }

  // Handle new subscription creation
  async handleSubscriptionCreated(subscription, customer) {
    try {
      console.log('Processing new subscription:', subscription.id);
      
      // Get affiliate ID from customer metadata or custom fields
      const affiliateId = customer.cf_affiliate_id || customer.meta_data?.affiliate_id;
      
      if (!affiliateId) {
        console.log('No affiliate ID found for subscription:', subscription.id);
        return;
      }

      // Get affiliate hierarchy (8 levels up)
      const affiliateHierarchy = await this.getAffiliateHierarchy(affiliateId);
      
      if (affiliateHierarchy.length === 0) {
        console.log('No affiliate hierarchy found for:', affiliateId);
        return;
      }

      // Calculate and record initial commissions
      await this.calculateAndRecordCommissions(
        subscription, 
        affiliateHierarchy, 
        'initial',
        subscription.plan_amount || 0
      );

      console.log(`Processed commissions for ${affiliateHierarchy.length} levels`);

    } catch (error) {
      console.error('Error handling subscription created:', error);
    }
  }

  // Handle recurring payments
  async handleRecurringPayment(subscription, invoice) {
    try {
      console.log('Processing recurring payment for:', subscription.id);
      
      // For demo purposes, simulate affiliate hierarchy
      // In production, you'd fetch this from your database
      const affiliateHierarchy = await this.getAffiliateHierarchy('demo-affiliate');
      
      if (affiliateHierarchy.length > 0) {
        await this.calculateAndRecordCommissions(
          subscription,
          affiliateHierarchy,
          'recurring',
          invoice.total || 0
        );
      }

    } catch (error) {
      console.error('Error handling recurring payment:', error);
    }
  }

  // Get affiliate hierarchy (8 levels up)
  async getAffiliateHierarchy(affiliateId) {
    // For demo purposes, return a mock hierarchy
    // In production, this would query your Base44 database
    return [
      { id: 'affiliate-1', level: 1, name: 'Level 1 Affiliate', email: 'level1@example.com' },
      { id: 'affiliate-2', level: 2, name: 'Level 2 Affiliate', email: 'level2@example.com' },
      { id: 'affiliate-3', level: 3, name: 'Level 3 Affiliate', email: 'level3@example.com' }
    ];
  }

  // Calculate and record commissions for all levels
  async calculateAndRecordCommissions(subscription, affiliateHierarchy, type, amount) {
    const commissions = [];

    for (const affiliate of affiliateHierarchy) {
      const levelKey = `level${affiliate.level}`;
      const commissionAmount = COMMISSION_AMOUNTS[levelKey];
      
      if (!commissionAmount) continue;

      const commission = {
        affiliate_id: affiliate.id,
        subscription_id: subscription.id,
        level: affiliate.level,
        type: type, // 'initial' or 'recurring'
        amount: commissionAmount, // Fixed dollar amount
        base_amount: amount,
        commission_rate: null, // No percentage rate for fixed amounts
        status: 'pending',
        created_at: new Date().toISOString(),
        billing_period: subscription.current_term_start ? 
          new Date(subscription.current_term_start * 1000).toISOString() : null
      };

      commissions.push(commission);
    }

    console.log(`Calculated ${commissions.length} commissions totaling $${commissions.reduce((sum, c) => sum + c.amount, 0)}`);

    // In production, this would save to your database
    // For demo, just log the commissions
    console.log('Commissions:', commissions);
    
    return commissions;
  }

  // Handle subscription cancellation
  async handleSubscriptionCancelled(subscription) {
    console.log('Subscription cancelled:', subscription.id);
  }

  // Handle subscription reactivation
  async handleSubscriptionReactivated(subscription) {
    console.log('Subscription reactivated:', subscription.id);
  }

  // Start the server
  start() {
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
      console.log(`🚀 Chargebee Affiliate Integration running on port ${PORT}`);
      console.log(`📊 Commission structure: L1=$${COMMISSION_AMOUNTS.level1}, L2=$${COMMISSION_AMOUNTS.level2}, L3=$${COMMISSION_AMOUNTS.level3}, L4-L8=$${COMMISSION_AMOUNTS.level4} each`);
      console.log(`💰 Payout threshold: $${PAYOUT_THRESHOLD}`);
      console.log(`🔗 Webhook endpoint: /webhooks/chargebee`);
    });
  }
}

// Initialize and start the integration
const integration = new ChargebeeAffiliateIntegration();
integration.start();

module.exports = ChargebeeAffiliateIntegration;
