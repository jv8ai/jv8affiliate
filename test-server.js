const express = require('express');
const app = express();

// Simple health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'working',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 'unknown'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
