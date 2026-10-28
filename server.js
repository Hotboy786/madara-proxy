const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Enable CORS for all cross-origin frontend requests
app.use(cors());

// Parse incoming JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route check
app.get('/', (req, res) => {
  res.send('Madara Proxy Server is Running');
});

// Base Proxy Route for SMM Panel API Requests
app.post('/proxy', async (req, res) => {
  try {
    // 1. Normalize frontend parameter names
    const targetUrl = req.body.url || req.body.apiUrl || req.body.api_url || req.body.baseUrl;
    const apiKey = req.body.key || req.body.apiKey || req.body.api_key;
    const action = req.body.action || 'services';
    
    // Extract any additional SMM data (e.g., service ID, link, quantity)
    const extraData = req.body.data || {};
    
    // Exclude redundant keys from extraData if present
    delete extraData.url;
    delete extraData.apiUrl;
    delete extraData.api_url;
    delete extraData.baseUrl;
    delete extraData.key;
    delete extraData.apiKey;
    delete extraData.api_key;
    delete extraData.action;

    // 2. Validate essential fields
    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    // 3. Build standardized SMM payload
    const payload = {
      key: apiKey,
      action: action,
      ...extraData,
      ...req.body // includes remaining top-level properties if passed directly
    };

    // Remove internal routing keys from payload sent to SMM provider
    delete payload.url;
    delete payload.apiUrl;
    delete payload.api_url;
    delete payload.baseUrl;

    // 4. Send POST request to the target SMM API endpoint
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

    // 5. Return provider response back to Madara Panel frontend
    return res.json(response.data);

  } catch (error) {
    console.error('Proxy Error:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// Bind dynamically to Render port (defaults to 10000)
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Madara Proxy running on port ${PORT}`);
});
