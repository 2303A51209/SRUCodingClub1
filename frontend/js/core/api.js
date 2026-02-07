/**
 * API Client with Interceptors
 * Handles all HTTP requests with automatic token refresh
 */

const API_BASE = '/api/v1';

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
     * Core request method
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;

        const config = {
            credentials: 'include', // Include cookies
            headers: {
                'Content-Type': 'application/json',
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
                if (this.isRefreshing) {
                    // Wait for the refresh to complete
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    }).then(() => this.request(endpoint, { ...options, _retry: true }));
                }

                this.isRefreshing = true;

                try {
                    await this.post('/auth/refresh');
                    this.isRefreshing = false;
                    this.processQueue();
                    // Retry original request
                    return this.request(endpoint, { ...options, _retry: true });
                } catch (refreshError) {
                    this.isRefreshing = false;
                    this.processQueue(refreshError);
                    // Redirect to login
                    window.location.href = '/login.html';
                    throw refreshError;
                }
            }

            // Parse response
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const error = new Error(data.error?.message || 'Request failed');
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
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

// Export singleton
const api = new ApiClient();
export default api;
