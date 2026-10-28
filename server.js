const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Madara Proxy Server is Running');
});

// 🌍 Universal Handler for ANY API or Order route your frontend calls
async function handleProxyRequest(req, res) {
  try {
    const targetUrl = req.body.baseUrl || req.body.url || req.body.apiUrl || req.body.api_url;
    const apiKey = req.body.apiKey || req.body.key || req.body.api_key || req.body.params?.key;
    
    // Determine action based on route or payload
    let action = req.body.action || req.body.params?.action;
    if (!action && req.path.includes('schedule')) action = 'add';

    const extraData = {
      ...(req.body.params || {}),
      ...(req.body.data || {})
    };

    delete extraData.key;
    delete extraData.apiKey;
    delete extraData.api_key;
    delete extraData.action;
    delete extraData.baseUrl;
    delete extraData.url;

    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    const payload = {
      key: apiKey,
      ...(action ? { action } : {}),
      ...extraData
    };

    const response = await axios({
      method: 'POST',
      url: targetUrl,
      data: qs.stringify(payload),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      timeout: 15000
    });

    return res.json(response.data);

  } catch (error) {
    console.error('Proxy Error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
}

// Map all common routes to the universal handler
app.post('/proxy', handleProxyRequest);
app.post('/schedule-order', handleProxyRequest);
app.post('/orders', handleProxyRequest);
app.post('/api', handleProxyRequest);

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Madara Proxy running on port ${PORT}`);
});
