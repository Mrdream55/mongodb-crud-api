const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

// =======================
// SINGLE DATABASE
// =======================
const MONGODB_URI = "mongodb+srv://faustinocarlo990_db_user:Carlojosefaustino@faustino1.4iubbte.mongodb.net/faustore";

// =======================
// Middleware
// =======================
app.use(cors());
app.use(bodyParser.json());

// =======================
// User Schema
// =======================
const UserSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }
}, { timestamps: true });

UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", UserSchema);

// =======================
// Product Schema
// =======================
const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    img: String
});
const Product = mongoose.model("Product", ProductSchema);

// =======================
// Routes
// =======================

// Root
app.get("/", (req, res) => {
    res.json({
        message: "API running",
        dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

// -----------------------
// USER ROUTES
// -----------------------
app.post("/api/users", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "All fields are required." });

    try {
        const user = new User({ email, password });
        await user.save();
        res.status(201).json({ message: "User created successfully!", email: user.email });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: "Email already exists." });
        res.status(500).json({ error: err.message });
    }
});

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

// -----------------------
// PRODUCT ROUTES
// -----------------------
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/products", async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ message: "Product Added", product: newProduct });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/products/:id", async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ error: "Product not found" });
        res.json({ message: "Product Updated", product: updatedProduct });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/products/:id", async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ error: "Product not found" });
        res.json({ message: "Product Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// Connect DB & Start Server
// =======================
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("✅ MongoDB connected");
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => console.error("❌ DB connection error:", err));
