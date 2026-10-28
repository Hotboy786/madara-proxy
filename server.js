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
    // 1. Extract target URL across all common frontend naming conventions
    const targetUrl = 
      req.body.url || 
      req.body.apiUrl || 
      req.body.api_url || 
      req.body.endpoint || 
      (req.body.data && (req.body.data.url || req.body.data.apiUrl));

    // 2. Extract API Key
    const key = 
      req.body.key || 
      req.body.apiKey || 
      req.body.api_key || 
      (req.body.data && (req.body.data.key || req.body.data.apiKey));

    // 3. Extract Action (defaults to services)
    const action = req.body.action || (req.body.data && req.body.data.action) || 'services';

    if (!targetUrl) {
      console.error('Incoming Request Body:', JSON.stringify(req.body));
      return res.status(400).json({ error: 'Target URL is required' });
    }

    // A. Handle Supabase Functions (e.g., OrganicSMM)
    if (targetUrl.includes('/functions/v1/')) {
      const payload = {
        key: key,
        action: action,
        ...(req.body.data || {})
      };

      const response = await axios.post(targetUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return res.json(response.data);
    }

    // B. Handle Standard SMM Panels (x-www-form-urlencoded)
    const params = new URLSearchParams();
    if (key) params.append('key', key);
    params.append('action', action);

    if (req.body.data && typeof req.body.data === 'object') {
      Object.keys(req.body.data).forEach((k) => {
        if (k !== 'key' && k !== 'action' && k !== 'url') {
          params.append(k, req.body.data[k]);
        }
      });
    }

    const response = await axios.post(targetUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Proxy Error Details:', error.response?.data || error.message);
    res.status(500).json({
      error: error.message,
      details: error.response?.data || null
    });
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
