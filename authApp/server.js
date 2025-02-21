const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect("mongodb+srv://akashcodeelevator:l4TXDFuBl5A7dLrD@teal-six.pcr5x.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // Admin/User Role
});
const rideSchema = new mongoose.Schema({
    name: { type: String, required: true },
    pickup: { type: String, required: true },
    drop: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);
const RideRequest = mongoose.model("RideRequest", rideSchema);
module.exports = RideRequest;
// Add Default Admin
const addAdmin = async () => {
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const admin = new User({ username: "admin", email: "admin@gmail.com", password: hashedPassword, role: "admin" });
        await admin.save();
        console.log("Admin user created");
    }
};
addAdmin();
// Register API
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(400).json({ message: "Username or email already exists!" });
    }
});

// Login API
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect password!" });

        res.json({
            message: "Login successful!",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
});
// API to Handle Ride Requests
app.post("/request-ride", async (req, res) => {
    try {
        const { name, pickup, drop, date, time } = req.body;
        const newRide = new RideRequest({ name, pickup, drop, date, time });
        await newRide.save();
        res.json({ message: "Ride request submitted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error submitting ride request!" });
    }
});

// Admin Panel APIs
app.get("/admin/users", async (req, res) => {
    try {
        let { page, limit } = req.query;
        page = parseInt(page) || 1; // Default to page 1
        limit = parseInt(limit) || 10; // Default limit is 10 users per page

        const totalUsers = await User.countDocuments();
        const users = await User.find()
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            users
        });
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
});

app.get("/admin/ride-requests", async (req, res) => {
    try {
        let { page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        const totalRequests = await RideRequest.countDocuments();
        const rideRequests = await RideRequest.find()
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            totalRequests,
            totalPages: Math.ceil(totalRequests / limit),
            currentPage: page,
            rideRequests
        });
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
});
// Start Server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
