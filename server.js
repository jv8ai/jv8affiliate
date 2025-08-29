const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.post('/webhooks/chargebee', (req, res) => {
  console.log('Webhook hit!');
  res.send('Webhook received!');
});

// Add this line for testing
app.get('/webhooks/chargebee', (req, res) => {
  res.send('Webhook endpoint is working! (This is a GET test)');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
