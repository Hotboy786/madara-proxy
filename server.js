const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// In-memory data arrays for Schedules tab
let ordersDatabase = [];
let activityLogsDatabase = [];

// Base Proxy Route for API Requests
app.post('/proxy', async (req, res) => {
  try {
    const response = await axios({
      method: req.body.method || 'POST',
      url: req.body.url,
      data: req.body.data,
      headers: req.body.headers
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
