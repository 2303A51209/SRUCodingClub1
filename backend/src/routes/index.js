const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const eventsRoutes = require('./events');
const usersRoutes = require('./users');
const announcementsRoutes = require('./announcements');
const galleryRoutes = require('./gallery');

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/users', usersRoutes);
router.use('/projects', require('./projects'));
router.use('/announcements', announcementsRoutes);
router.use('/gallery', galleryRoutes);
router.use('/gallery/drive', require('./driveGallery'));
router.use('/admin', require('./admin'));
router.use('/register', require('./registrations'));
router.use('/upload', require('./upload'));

module.exports = router;
