const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Madara Proxy Server is Running');
});

app.post('/proxy', async (req, res) => {
  try {
    // Extract target URL from baseUrl or root fields
    const targetUrl = req.body.baseUrl || req.body.url || req.body.apiUrl || req.body.api_url;
    
    // Extract key and action from either top-level or nested 'params' object
    const apiKey = req.body.apiKey || req.body.key || req.body.api_key || req.body.params?.key || req.body.params?.apiKey;
    const action = req.body.action || req.body.params?.action || 'services';
    
    // Combine any extra data from root and nested params
    const extraData = {
      ...(req.body.params || {}),
      ...(req.body.data || {})
    };

    // Clean internal properties out of outgoing data
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

    // Build standard SMM payload expected by provider
    const payload = {
      key: apiKey,
      action: action,
      ...extraData
    };

    const response = await axios({
      method: 'POST',
      url: targetUrl,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
