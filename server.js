const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'active', 
    service: 'Chargebee Affiliate Integration',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.post('/webhooks/chargebee', (req, res) => {
  console.log('Webhook received:', req.body.event_type || 'unknown');
  res.json({ status: 'received' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Commission structure: L1=$8, L2=$4, L3=$2, L4-L8=$1 each');
  console.log('Webhook endpoint ready: /webhooks/chargebee');
});
