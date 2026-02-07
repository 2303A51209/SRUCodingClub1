/**
 * Pure Supabase Auth Client
 * Stores Supabase session tokens in localStorage
 */
import api from './api.js';
import store from './store.js';

const AUTH_KEYS = {
    ACCESS_TOKEN: 'sb_access_token',
    REFRESH_TOKEN: 'sb_refresh_token',
    USER: 'sb_user',
    PROFILE: 'sb_profile',
};

class AuthService {
    constructor() {
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize auth state from storage
     */
    async init() {
        if (this.initialized) return store.getState().user;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit();
        return this.initPromise;
    }

    async _doInit() {
        try {
            const accessToken = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);

            if (!accessToken) {
                this.initialized = true;
                return null;
            }

            // Verify token with backend
            const response = await api.get('/auth/me');

            if (response.success && response.data) {
                const { user, profile } = response.data;
                store.setState({
                    user: profile || user,
                    isAuthenticated: true,
                });
                this.initialized = true;
                return profile || user;
            }
        } catch (error) {
            console.log('Auth init failed, clearing session');
            this.clearSession();
        }

        this.initialized = true;
        return null;
    }

    /**
     * Register a new user
     */
    async register(email, password, fullName) {
        const response = await api.post('/auth/register', {
            email,
            password,
            fullName,
        });

        if (response.success && response.data?.session) {
            this.setSession(response.data.session, response.data.user);
        }

        return response;
    }

    /**
     * Login user
     */
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });

        if (response.success && response.data?.session) {
            this.setSession(response.data.session, response.data.profile || response.data.user);
            return response.data;
        }

        throw new Error(response.error?.message || 'Login failed');
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // Ignore errors
        }
        this.clearSession();
        window.location.href = '/login.html';
    }

    /**
     * Send password reset email
     */
    async forgotPassword(email) {
        const response = await api.post('/auth/forgot-password', { email });
        return response;
    }

    /**
     * Refresh session
     */
    async refreshSession() {
        const refreshToken = localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        const response = await api.post('/auth/refresh', {
            refresh_token: refreshToken,
        });

        if (response.success && response.data?.session) {
            this.setSession(response.data.session, response.data.user);
            return response.data.session;
        }

        throw new Error('Failed to refresh session');
    }

    /**
     * Store session tokens
     */
    setSession(session, user) {
        if (session?.access_token) {
            localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, session.access_token);
        }
        if (session?.refresh_token) {
            localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, session.refresh_token);
        }
        if (user) {
            localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
            store.setState({
                user,
                isAuthenticated: true,
            });
        }
    }

    /**
     * Clear session
     */
    clearSession() {
        localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(AUTH_KEYS.USER);
        localStorage.removeItem(AUTH_KEYS.PROFILE);
        store.setState({
            user: null,
            isAuthenticated: false,
        });
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * Get current user
     */
    getUser() {
        return store.getState().user;
    }

    /**
     * Get access token
     */
    getAccessToken() {
        return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    }

    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return store.getState().isAuthenticated;
    }

    /**
     * Check if user has one of the specified roles
     * @param {string|string[]} roles - Role or array of roles to check
     */
    hasRole(roles) {
        const user = this.getUser();
        if (!user) return false;

        const userRole = user.role || 'member';
        const roleArray = Array.isArray(roles) ? roles : [roles];

        return roleArray.includes(userRole);
    }
}

const auth = new AuthService();
export default auth;
