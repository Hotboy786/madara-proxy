const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

app.post('/proxy', async (req, res) => {
    try {
        // Forwards the request to your actual SMM Provider API
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
