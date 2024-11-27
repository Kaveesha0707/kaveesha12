require("dotenv").config();
const mongoose = require("mongoose");

// MongoDB connection logic
const connectToDatabase = async () => {
  if (mongoose.connection.readyState) return;

  const MONGO_URI = process.env.MONGO_URI; 
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Database connection failed");
  }
};

// Define Schema and Model
const keywordSchema = new mongoose.Schema({
  text: { type: String, required: true },
  alertCount: { type: Number, default: 0 },
});

const Keyword = mongoose.model("Keyword", keywordSchema);

// Serverless function to handle API requests
module.exports = async (req, res) => {
  // Ensure database connection
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const keywords = await Keyword.find();
      res.status(200).json(keywords);
    } catch (err) {
      console.error("Error fetching keywords:", err.message);
      res.status(500).send("Unable to fetch keywords.");
    }
  } else if (req.method === "POST") {
    const { text } = req.body;

    if (!text || text.length < 3 || text.length > 50) {
      return res.status(400).send("Keyword text must be between 3 and 50 characters.");
    }

    try {
      const existingKeyword = await Keyword.findOne({ text });
      if (existingKeyword) {
        return res.status(400).send("Keyword already exists.");
      }

      const newKeyword = new Keyword({ text });
      await newKeyword.save();
      res.status(201).json(newKeyword);
    } catch (err) {
      console.error("Error adding keyword:", err.message);
      res.status(500).send("Unable to add keyword.");
    }
  } else if (req.method === "DELETE") {
    const { id } = req.params;

    try {
      await Keyword.findByIdAndDelete(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting keyword:", err.message);
      res.status(500).send("Unable to delete keyword.");
    }
  } else {
    res.setHeader("Allow", "GET, POST, DELETE");
    res.status(405).send("Method Not Allowed");
  }
};
