/**
 * Auth Module
 * Handles authentication state and operations
 */

import api from './api.js';
import store from './store.js';

class AuthService {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize auth state - call on app start
     */
    async init() {
        if (this.initialized) return store.getState().user;

        try {
            const { user } = await api.get('/auth/me');
            store.setState({ user, isAuthenticated: true });
            this.initialized = true;
            return user;
        } catch (error) {
            store.setState({ user: null, isAuthenticated: false });
            this.initialized = true;
            return null;
        }
    }

    /**
     * Login
     */
    async login(email, password) {
        await api.post('/auth/login', { email, password });
        return this.init();
    }

    /**
     * Register
     */
    async register(email, password, fullName) {
        return api.post('/auth/register', { email, password, fullName });
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await api.post('/auth/logout');
        } finally {
            store.setState({ user: null, isAuthenticated: false });
            window.location.href = '/login.html';
        }
    }

    /**
     * Forgot Password
     */
    async forgotPassword(email) {
        return api.post('/auth/forgot-password', { email });
    }

    /**
     * Reset Password
     */
    async resetPassword(token, password) {
        return api.post('/auth/reset-password', { token, password });
    }

    /**
     * Get current user
     */
    getUser() {
        return store.getState().user;
    }

    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return store.getState().isAuthenticated;
    }

    /**
     * Check if user has a specific role
     */
    hasRole(roles) {
        const user = this.getUser();
        if (!user) return false;
        if (typeof roles === 'string') roles = [roles];
        return roles.includes(user.role);
    }
}

const auth = new AuthService();
export default auth;
