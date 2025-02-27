const express = require('express');
const pdfParse = require('pdf-parse');

const app = express();

// Middleware to handle raw binary data (application/octet-stream)
app.use(express.raw({ type: 'application/pdf', limit: '20mb' }));

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/extract', async (req, res) => {
    try {
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Extract text from the PDF buffer
        const data = await pdfParse(req.body);

        // Return extracted text as JSON
        res.json({ text: data.text });
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Error processing PDF: ' + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;