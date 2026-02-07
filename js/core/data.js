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
        // Backend returns { success: true, data: [...], count: ... }
        // Frontend expects { events: [...] } or [...]
        const res = response.data || response;
        if (res.data && Array.isArray(res.data)) {
            return {
                events: res.data,
                count: res.count,
                ...res
            };
        }
        return res;
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
     * Submit complex registration (Team/Solo)
     */
    async submitRegistration(data) {
        const response = await api.post('/register', data);
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
        // Return full response to preserve pagination info
        // Response format: { success, data: [...], pagination: {...} }
        return response;
    },

    /**
     * Fetch gallery images from Google Drive folder
     * @param {string} folderUrl - Google Drive folder URL or ID
     * @param {number} pageSize - Number of images to fetch (default: 100)
     */
    async getDriveGallery(folderUrl, pageSize = 100) {
        const params = new URLSearchParams({ folderUrl, pageSize });
        const response = await api.get(`/gallery/drive?${params}`);
        return response;
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
    },

    /**
     * Admin: Create Event
     */
    async createEvent(data) {
        const response = await api.post('/events', data);
        return response.data;
    },

    /**
     * Admin: Update Event
     */
    async updateEvent(id, data) {
        const response = await api.patch(`/events/${id}`, data);
        return response.data;
    },

    /**
     * Admin: Get Registrations
     */
    async getEventRegistrations(eventId) {
        // This endpoint needs to be created in backend or use existing? 
        // We added /admin/registrations in implementation plan, but didn't implement it yet?
        // Wait, I didn't implement GET /admin/registrations in backend!
        // I implemented registrations.js (POST).
        // I need to implement GET /admin/registrations?event_id=...
        // For now I'll point to it, and implement backend next.
        const response = await api.get(`/admin/registrations/${eventId}`);
        return response.data;
    }, // Added missing closing brace and comma

    /**
     * Admin: Update Registration Status
     */
    async updateRegistrationStatus(id, data) {
        const response = await api.patch(`/register/${id}`, data);
        return response.data;
    }
};

export default dataService;
