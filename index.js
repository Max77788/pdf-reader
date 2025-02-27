const express = require('express');
const pdfParse = require('pdf-parse');

const app = express();

// Increase the JSON body limit if needed
app.use(express.json({ limit: '20mb' }));

/**
 * POST /extract
 * Expects a JSON payload with a "fileData" property (base64 encoded PDF).
 * Returns the extracted text from the PDF.
 */

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/extract', async (req, res) => {
    try {
        const { fileData } = req.body;
        if (!fileData) {
            return res.status(400).json({ error: 'No fileData provided' });
        }
        // Convert the base64 string into a buffer
        const pdfBuffer = Buffer.from(fileData, 'base64');
        // Extract text from the PDF buffer
        const data = await pdfParse(pdfBuffer);
        // Return the extracted text in a JSON response
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
