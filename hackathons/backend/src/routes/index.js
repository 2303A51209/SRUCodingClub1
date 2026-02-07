/**
 * Hackathons Platform - Route Aggregator
 */
const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');

// Mount routes
router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Hackathons API is running',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
