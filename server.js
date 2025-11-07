const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// IMPORTANT: NEVER hardcode secrets like this in production! Use environment variables (e.g., process.env.MONGODB_URI)
// I am keeping your provided URI as an example:
const MONGODB_URI = "mongodb+srv://faustinocarlo990_db_user:Carlojosefaustino@faustino1.4iubbte.mongodb.net/users"
// Middleware Setup
app.use(cors());
app.use(bodyParser.json());

// --- Mongoose Schema & Model ---
// Define a robust schema with timestamps for better debugging and data tracking
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true, // Ensure emails are saved consistently
        trim: true
    }
}, { 
    timestamps: true // Adds createdAt and updatedAt fields
});

const User = mongoose.model("User", UserSchema);

// --- API Route Handlers ---

// Root route for health check
app.get("/", (req, res) => {
    res.json({ message: "User Management API is running!", databaseStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" });
});

// POST: Create a new user
app.post("/api/users", async (req, res) => {
    const { name, email } = req.body;
    
    // Check for required fields
    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required fields." });
    }

    try {
        // Create and save the new user document
        const newUser = new User({ name, email });
        await newUser.save();
        
        // Success response
        res.status(201).json(newUser); 
    } catch (err) {
        // Handle duplicate key error (code 11000) for the unique email field
        if (err.code === 11000) {
            return res.status(409).json({ error: "Email already exists in the database." });
        }
        // Handle validation errors or other server errors
        res.status(500).json({ error: "Failed to create user: " + err.message });
    }
});

// GET: Fetch all users
app.get("/api/users", async (req, res) => {
    try {
        // Find all users and sort them by creation date
        const users = await User.find().sort({ createdAt: -1 }); 
        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Failed to fetch users: " + err.message });
    }
});

// --- Server Initialization ---

const connectDB = async () => {
    try {
        // Mongoose automatically manages deprecated options in recent versions
        await mongoose.connect(MONGODB_URI);
        console.log("✅ MongoDB connected successfully.");
    } catch (err) {
        // Log the detailed error message
        console.error("❌ MongoDB connection error:", err.message);
        // Do NOT exit here if the error is just ENOTFOUND or connectivity; 
        // the server can still start, but we want to ensure the server starts 
        // after a successful DB connection or a critical error.
        throw err; // Re-throw to be caught by startServer
    }
};

const startServer = async () => {
    try {
        await connectDB();
        
        // Start Server only after DB connection is established
        app.listen(PORT, () => 
            console.log(`🚀 Server running on http://localhost:${PORT}`)
        );

    } catch (err) {
        // If connectDB fails (e.g., DNS error, authentication failure), log and exit
        console.error("Server startup failed due to database error. Please check your URI and IP whitelist.");
        process.exit(1); 
    }
};

startServer();
