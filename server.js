require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*', // Limit origin in production
  })
);

// Serve static files from the 'public' folder (for React/SPAs)
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Exit if the connection fails
  });

// Define Schema and Model
const keywordSchema = new mongoose.Schema({
  text: { type: String, required: true },
  alertCount: { type: Number, default: 0 },
});

const Keyword = mongoose.model('Keyword', keywordSchema);

// API Routes

// Get all keywords
app.get('/api/keywords', async (req, res) => {
  try {
    const keywords = await Keyword.find();
    res.json(keywords);
  } catch (err) {
    console.error('Error fetching keywords:', err.message);
    res.status(500).send('Unable to fetch keywords.');
  }
});

// Add a new keyword
app.post('/api/keywords', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).send('Keyword text is required.');
  }

  try {
    const existingKeyword = await Keyword.findOne({ text });
    if (existingKeyword) {
      return res.status(400).send('Keyword already exists.');
    }

    const newKeyword = new Keyword({ text });
    await newKeyword.save();
    res.status(201).json(newKeyword);
  } catch (err) {
    console.error('Error adding keyword:', err.message);
    res.status(500).send('Unable to add keyword.');
  }
});

// Delete a keyword
app.delete('/api/keywords/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Keyword.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting keyword:', err.message);
    res.status(500).send('Unable to delete keyword.');
  }
});

// Catch-all Route (for React/SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
