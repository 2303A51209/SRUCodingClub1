const express = require('express');
const authService = require('../services/authService');
const { catchAsync } = require('../utils/errors');
const { validate } = require('../middleware/validator');
const z = require('zod');

const router = express.Router();

// Validation Schemas
const registerSchema = {
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(2),
    }),
};

const loginSchema = {
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
};

// Register
router.post('/register', validate(registerSchema), catchAsync(async (req, res) => {
    const { email, password, fullName } = req.body;
    const result = await authService.register(email, password, fullName);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: {
                id: result.user.id,
                email: result.user.email,
            },
            session: result.session,
        },
    });
}));

// Login
router.post('/login', validate(loginSchema), catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
        success: true,
        data: {
            user: {
                id: result.user.id,
                email: result.user.email,
            },
            profile: result.profile,
            session: result.session,
        },
    });
}));

// Refresh
router.post('/refresh', catchAsync(async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const result = await authService.refreshSession(refresh_token);

    res.json({
        success: true,
        data: {
            session: result.session,
            user: result.user,
        },
    });
}));

// Logout
router.post('/logout', catchAsync(async (req, res) => {
    await authService.logout();
    res.json({ success: true });
}));

// Forgot Password
router.post('/forgot-password', catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    await authService.forgotPassword(email);

    res.json({
        success: true,
        message: 'Password reset email sent if account exists',
    });
}));

// Reset Password
router.post('/reset-password', catchAsync(async (req, res) => {
    const { accessToken, password } = req.body;

    if (!accessToken || !password) {
        return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    await authService.resetPassword(accessToken, password);

    res.json({
        success: true,
        message: 'Password has been updated successfully',
    });
}));

// Get Current User (Me)
router.get('/me', catchAsync(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.getUser(token);

    res.json({
        success: true,
        data: {
            user: {
                id: result.user.id,
                email: result.user.email,
            },
            profile: result.profile,
        },
    });
}));

module.exports = router;
