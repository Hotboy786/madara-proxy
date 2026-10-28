const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs'); // Built into Node.js environment or standard npm package

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Madara Proxy Server is Running');
});

app.post('/proxy', async (req, res) => {
  try {
    // 1. Extract target URL
    const targetUrl = req.body.baseUrl || req.body.url || req.body.apiUrl || req.body.api_url;
    
    // 2. Extract API Key and Action from top-level or nested params
    const apiKey = req.body.apiKey || req.body.key || req.body.api_key || req.body.params?.key || req.body.params?.apiKey;
    const action = req.body.action || req.body.params?.action || 'balance';
    
    // 3. Extract extra parameters
    const extraData = {
      ...(req.body.params || {}),
      ...(req.body.data || {})
    };

    // Clean internal routing properties
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

    // 4. Build standard SMM payload
    const payload = {
      key: apiKey,
      action: action,
      ...extraData
    };

    // 5. Send as application/x-www-form-urlencoded using qs.stringify
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
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Madara Proxy running on port ${PORT}`);
});
