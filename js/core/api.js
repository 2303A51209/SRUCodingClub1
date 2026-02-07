/**
 * API Client for Pure Supabase Auth
 * Sends Bearer token from localStorage
 */

const getApiBase = () => {
    // If running on backend port, use relative path
    if (window.location.port === '3000') return '/api/v1';

    // If running on other local ports (e.g. 5500 for Live Server) or file://
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:') {
        return 'http://localhost:3000/api/v1';
    }

    // Production fallback
    return '/api/v1';
};

const API_BASE = getApiBase();
const TOKEN_KEY = 'sb_access_token';
const REFRESH_KEY = 'sb_refresh_token';

class ApiClient {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
    }

    /**
     * Process queued requests after token refresh
     */
    processQueue(error = null) {
        this.failedQueue.forEach((promise) => {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve();
            }
        });
        this.failedQueue = [];
    }

    /**
     * Get access token from storage
     */
    getAccessToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Core request method
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const token = this.getAccessToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers,
            },
            ...options,
        };

        // Convert body to JSON if object
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);

            // Handle 401 - Attempt Token Refresh
            if (response.status === 401 && !options._retry) {
                // Don't refresh for auth endpoints
                if (endpoint.includes('/auth/')) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.error?.message || 'Unauthorized');
                }

                // Try to refresh token
                if (!this.isRefreshing) {
                    this.isRefreshing = true;

                    try {
                        await this.refreshToken();
                        this.processQueue();
                    } catch (refreshError) {
                        this.processQueue(refreshError);
                        this.clearTokens();
                        throw refreshError;
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                // Retry the original request
                return this.request(endpoint, { ...options, _retry: true });
            }

            // Parse response
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const error = new Error(data.error?.message || `Request failed: ${response.status}`);
                error.status = response.status;
                console.error('API Error:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken() {
        const refreshToken = localStorage.getItem(REFRESH_KEY);

        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();

        if (data.success && data.data?.session) {
            localStorage.setItem(TOKEN_KEY, data.data.session.access_token);
            if (data.data.session.refresh_token) {
                localStorage.setItem(REFRESH_KEY, data.data.session.refresh_token);
            }
        }
    }

    /**
     * Clear tokens
     */
    clearTokens() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
    }

    // HTTP Methods
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

const api = new ApiClient();
export default api;
