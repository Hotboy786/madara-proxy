const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// In-memory storage for Schedules tab
let ordersDatabase = [];
let activityLogsDatabase = [];

// Dynamic Proxy Route (Handles standard SMM panels + Supabase JSON endpoints)
app.post('/proxy', async (req, res) => {
  try {
    const targetUrl = req.body.url;
    const key = req.body.key;
    const action = req.body.action || 'services';

    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    // 1. Handling Supabase Edge Functions (e.g., OrganicSMM)
    if (targetUrl.includes('/functions/v1/')) {
      const response = await axios.post(
        targetUrl,
        { key, action, ...(req.body.data || {}) },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      return res.json(response.data);
    }

    // 2. Handling Standard SMM Panels (x-www-form-urlencoded format)
    const params = new URLSearchParams();
    if (key) params.append('key', key);
    params.append('action', action);

    if (req.body.data) {
      Object.keys(req.body.data).forEach((k) => {
        params.append(k, req.body.data[k]);
      });
    }

    const response = await axios.post(targetUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
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

// Schedules & Logs Tab Endpoints
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
