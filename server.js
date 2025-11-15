const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

const MONGODB_URI = "mongodb+srv://faustinocarlo990_db_user:Carlojosefaustino@faustino1.4iubbte.mongodb.net/users";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", UserSchema);

// Routes
app.get("/", (req, res) => {
    res.json({ message: "User API running", db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" });
});

// Sign Up
app.post("/api/users", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required." });

    try {
        const user = new User({ name, email, password });
        await user.save();
        res.status(201).json({ message: "User created successfully!", email: user.email });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: "Email already exists." });
        res.status(500).json({ error: err.message });
    }
});

// Sign In
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required." });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "User not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Incorrect password." });

        res.json({ message: "Login successful", user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Connect DB and start server
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB connected");
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    })
    .catch(err => console.error("❌ DB connection error:", err));
