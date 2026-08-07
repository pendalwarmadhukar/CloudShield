const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_dev', {
        expiresIn: '24h',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        // Check if username exists
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ error: 'Username already taken by another agent' });
        }

        // Check if email exists
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ error: 'Email already registered in the CloudShield network' });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password
        });

        // Generate token and respond
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Registration Error:', error);
        
        // Handle Mongoose Validation Error (e.g. password too short)
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message).join(', ');
            return res.status(400).json({ error: message });
        }

        // Handle MongoDB Duplicate Key Error (Code 11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ 
                error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please choose another.` 
            });
        }

        res.status(500).json({ error: 'Secure node malfunctioned during registration. Try again.' });
    }
};


// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // Check for user email explicitly selecting password
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
             return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Remove password from response
        user.password = undefined;

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    res.status(200).json(req.user);
};
