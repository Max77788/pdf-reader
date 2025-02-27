const express = require('express');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pdfAnalysis', {
    useUnifiedTopology: true
});

// Define Schema
const PdfAnalysisSchema = new mongoose.Schema({
    _id: String,
    status: { type: String, default: 'processing' },
    text: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

const PdfAnalysis = mongoose.model('PdfAnalysis', PdfAnalysisSchema, "pdf-files");

// Middleware to handle raw binary data (application/octet-stream)
app.use(express.raw({ type: 'application/pdf', limit: '20mb' }));

app.get('/', (req, res) => {
    res.send('Hello World');
});

// POST /extract - Starts PDF processing
app.post('/extract', async (req, res) => {
    try {
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Generate unique ID
        const jobId = uuidv4();

        // Save initial processing status in MongoDB
        await PdfAnalysis.create({ _id: jobId });

        // Process PDF asynchronously
        pdfParse(req.body)
            .then(async (data) => {
                await PdfAnalysis.findByIdAndUpdate(jobId, {
                    status: 'completed',
                    text: data.text
                });
            })
            .catch(async (error) => {
                console.error('Error processing PDF:', error);
                await PdfAnalysis.findByIdAndUpdate(jobId, { status: 'error' });
            });

        // Return the job ID
        res.json({ jobId });
    } catch (error) {
        console.error('Error starting PDF processing:', error);
        res.status(500).json({ error: 'Error starting PDF processing: ' + error.message });
    }
});

// GET /status/:id - Check PDF processing status
app.get('/status/:id', async (req, res) => {
    try {
        const job = await PdfAnalysis.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ status: job.status, text: job.text });
    } catch (error) {
        console.error('Error fetching job status:', error);
        res.status(500).json({ error: 'Error fetching job status: ' + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
