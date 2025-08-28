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
const PAYOUT_THRESHOLD = 50.00;
const DEFAULT_PAYOUT_PROVIDER = 'stripe';

// Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

// Commission structure (8 levels) - Fixed dollar amounts
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

class ChargebeeAffiliateIntegration {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
    this.setupWebhooks();
  }

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

  setupWebhooks() {
    this.app.post('/webhooks/chargebee', async (req, res) => {
      try {
        console.log('Received Chargebee webhook:', req.body.event_type);
        await this.handleWebhookEvent(req.body);
        res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  async handleWebhookEvent(event) {
    const { event_type, content } = event;
    console.log(`Processing event: ${event_type}`);

    try {
      switch (event_type) {
        case 'subscription_created':
          await this.handleSubscriptionCreated(content.subscription, content.customer);
          break;
        
        case 'subscription_renewed':
        case 'invoice_gen
