const express = require('express');
const app = express();

// Add JSON parsing middleware
app.use(express.json());

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

const PAYOUT_THRESHOLD = 50.00;

// Configuration from environment variables
const CHARGEBEE_SITE = process.env.CHARGEBEE_SITE;
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

class AffiliateProcessor {
  // Mock affiliate hierarchy for demo - in production this would query your Base44 database
  async getAffiliateHierarchy(affiliateId) {
    console.log(`🔍 Looking up affiliate hierarchy for: ${affiliateId}`);
    
    // Return mock 8-level hierarchy
    return [
      { id: 'aff-001', level: 1, name: 'John Smith', email: 'john@example.com', balance: 45.00 },
      { id: 'aff-002', level: 2, name: 'Sarah Johnson', email: 'sarah@example.com', balance: 38.00 },
      { id: 'aff-003', level: 3, name: 'Mike Wilson', email: 'mike@example.com', balance: 52.00 },
      { id: 'aff-004', level: 4, name: 'Lisa Brown', email: 'lisa@example.com', balance: 23.00 },
      { id: 'aff-005', level: 5, name: 'Tom Davis', email: 'tom@example.com', balance: 67.00 },
      { id: 'aff-006', level: 6, name: 'Amy Miller', email: 'amy@example.com', balance: 31.00 },
      { id: 'aff-007', level: 7, name: 'Chris Taylor', email: 'chris@example.com', balance: 49.00 },
      { id: 'aff-008', level: 8, name: 'Emma Garcia', email: 'emma@example.com', balance: 55.00 }
    ];
  }

  async processCommissions(subscription, customer, type = 'initial') {
    console.log(`\n💰 PROCESSING ${type.toUpperCase()} COMMISSIONS`);
    console.log(`📋 Subscription: ${subscription.id}`);
    console.log(`👤 Customer: ${customer.first_name} ${customer.last_name} (${customer.email})`);
    console.log(`💵 Amount: $${(subscription.plan_unit_price / 100).toFixed(2)}`);
    
    // Get affiliate ID from customer (you'd customize this based on your setup)
    const affiliateId = customer.cf_affiliate_id || customer.meta_data?.affiliate_id || 'demo-affiliate';
    
    // Get affiliate hierarchy
    const affiliateHierarchy = await this.getAffiliateHierarchy(affiliateId);
    
    let totalCommissions = 0;
    const commissions = [];
    
    console.log(`\n🎯 COMMISSION BREAKDOWN:`);
    
    for (const affiliate of affiliateHierarchy) {
      const levelKey = `level${affiliate.level}`;
      const commissionAmount = COMMISSION_AMOUNTS[levelKey];
      
      if (commissionAmount) {
        // Create commission record
        const commission = {
          affiliate_id: affiliate.id,
          affiliate_name: affiliate.name,
          subscription_id: subscription.id,
          level: affiliate.level,
          type: type,
          amount: commissionAmount,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        
        commissions.push(commission)
