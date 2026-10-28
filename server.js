const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// In-memory data arrays for Schedules & Logs
let ordersDatabase = [];
let activityLogsDatabase = [];

// Base Proxy Route for API Requests (Matches KM Panel & Supabase requirements)
app.post('/proxy', async (req, res) => {
  try {
    const targetUrl = req.body.url || req.body.apiUrl || req.body.api_url;
    const apiKey = req.body.key || req.body.apiKey || req.body.api_key;
    const action = req.body.action || 'services';
    const extraData = req.body.data || {};

    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    // Forward request as JSON payload to Supabase Edge Functions or SMM endpoints
    const response = await axios({
      method: 'POST',
      url: targetUrl,
      data: {
        key: apiKey,
        action: action,
        ...extraData
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.response?.data || error.message);
    res.status(500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// Schedules Tab Endpoints
app.get('/orders', (req, res) => {
  res.json(ordersDatabase);
});

app.get('/activity-log', (req, res) => {
  res.json(activityLogsDatabase);
});

app.delete('/orders/:id', (req, res) => {
  const { id } = req.params;
  ordersDatabase = ordersDatabase.filter((order) => order.id !== id);
  res.json({ success: true, message: `Deleted order ${id}` });
});

app.post('/orders/:id/pause', (req, res) => {
  const { id } = req.params;
  const order = ordersDatabase.find((o) => o.id === id);
  if (order) order.status = 'paused';
  res.json({ success: true, order });
});

app.post('/orders/:id/resume', (req, res) => {
  const { id } = req.params;
  const order = ordersDatabase.find((o) => o.id === id);
  if (order) order.status = 'active';
  res.json({ success: true, order });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

module.exports = app;
