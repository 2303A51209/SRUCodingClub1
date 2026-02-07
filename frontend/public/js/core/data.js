/**
 * Data Service
 * Fetches data from the backend API for public pages
 */

import api from './api.js';

const dataService = {
    /**
     * Fetch all events with optional filters
     */
    async getEvents({ type = 'all', status = 'all', page = 1, limit = 10 } = {}) {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (type && type !== 'all') params.append('type', type);
        if (status && status !== 'all') params.append('status', status);

        const response = await api.get(`/events?${params}`);
        return response.data || response;
    },

    /**
     * Fetch single event by ID
     */
    async getEvent(id) {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    /**
     * Register for an event
     */
    async registerForEvent(eventId) {
        const response = await api.post(`/events/${eventId}/register`);
        return response.data;
    },

    /**
     * Cancel event registration
     */
    async cancelRegistration(eventId) {
        const response = await api.delete(`/events/${eventId}/register`);
        return response.data;
    },

    /**
     * Fetch gallery items
     */
    async getGallery({ category = 'all', page = 1, limit = 20 } = {}) {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (category && category !== 'all') params.append('category', category);

        const response = await api.get(`/gallery?${params}`);
        return response.data || response;
    },

    /**
     * Fetch projects
     */
    async getProjects({ category = 'all', page = 1, limit = 20, featured = false } = {}) {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (category && category !== 'all') params.append('category', category);
        if (featured) params.append('featured', 'true');

        const response = await api.get(`/projects?${params}`);
        return response.data || response;
    },

    /**
     * Fetch team members
     */
    async getTeamMembers() {
        const response = await api.get('/users/team');
        return response.data;
    },

    /**
     * Fetch announcements
     */
    async getAnnouncements({ limit = 10 } = {}) {
        const response = await api.get(`/announcements?limit=${limit}`);
        return response.data || response;
    },

    /**
     * Fetch user's registered events
     */
    async getMyEvents() {
        const response = await api.get('/users/me/events');
        return response.data;
    },

    /**
     * Fetch user's certificates
     */
    async getMyCertificates() {
        const response = await api.get('/users/me/certificates');
        return response.data;
    },

    /**
     * Get user profile
     */
    async getProfile() {
        const response = await api.get('/users/me');
        return response.data;
    },

    /**
     * Update user profile
     */
    async updateProfile(data) {
        const response = await api.patch('/users/me', data);
        return response.data;
    },

    /**
     * Admin: Get all users
     */
    async getUsers({ page = 1, limit = 10, role = 'all', search = '' } = {}) {
        const params = new URLSearchParams({ page, limit, role });
        if (search) params.append('search', search);

        const response = await api.get(`/users?${params}`);
        return response.data;
    },

    /**
     * Admin: Update user role
     */
    async updateUserRole(userId, role) {
        const response = await api.patch(`/users/${userId}/role`, { role });
        return response.data;
    },

    /**
     * Admin: Get dashboard stats
     */
    async getAdminStats() {
        const response = await api.get('/admin/stats');
        return response.data;
    }
};

export default dataService;
