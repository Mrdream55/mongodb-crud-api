const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

// =======================
// MongoDB URIs
// =======================
const USER_MONGODB_URI = "mongodb+srv://faustinocarlo990_db_user:Carlojosefaustino@faustino1.4iubbte.mongodb.net/users";
const PRODUCT_MONGODB_URI = "mongodb+srv://faustinocarlo990_db_user:Carlojosefaustino@faustino1.4iubbte.mongodb.net/product";

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

// Hash password before saving
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
        usersDB: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

// -----------------------
// USER ROUTES
// -----------------------

// Sign Up
app.post("https://faustore.onrender.com/api/users", async (req, res) => {
    const {  email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "All fields are required." });

    try {
        const user = new User({  email, password });
        await user.save();
        res.status(201).json({ message: "User created successfully!", email: user.email });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: "Email already exists." });
        res.status(500).json({ error: err.message });
    }
});

// Sign In
app.post("https://faustore.onrender.com/api/login", async (req, res) => {
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

// Get all products
app.get("https://faustore.onrender.com/api/products", async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// Add product
app.post("https://faustore.onrender.com/api/products", async (req, res) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({ message: "Product Added", product: newProduct });
});

// Update product
app.put("https://faustore.onrender.com/api/products/:id", async (req, res) => {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Product Updated" });
});

// Delete product
app.delete("https://faustore.onrender.com/api/products/:id", async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product Deleted" });
});

// =======================
// Connect DB & Start Server
// =======================

mongoose.connect(USER_MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("✅ Users MongoDB connected");
        // Connect products DB
        return mongoose.createConnection(PRODUCT_MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    })
    .then(() => {
        console.log("✅ Products MongoDB connected");
        app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
    })
    .catch(err => console.error("❌ DB connection error:", err));
