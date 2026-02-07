/**
 * Hackathons Platform - Configuration
 * API endpoints and constants
 */
const config = {
    apiBase: '/api',
    publicApi: '/api/public',
    adminApi: '/api/admin',
    authApi: '/api/auth',
};

// Helper function to make API calls
async function api(endpoint, options = {}) {
    const url = `${config.apiBase}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
}

// Public API helpers
const publicApi = {
    getHackathons: () => api('/public/hackathons'),
    getHackathon: (id) => api(`/public/hackathons/${id}`),
    getRegistrationInfo: (id) => api(`/public/hackathons/${id}/registration-info`),
    register: (data) => api('/public/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// Admin API helpers
const adminApi = {
    // Auth
    login: (email, password) => api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }),
    logout: () => api('/auth/logout', { method: 'POST' }),
    getMe: () => api('/auth/me'),

    // Hackathons
    getHackathons: () => api('/admin/hackathons'),
    getHackathon: (id) => api(`/admin/hackathons/${id}`),
    createHackathon: (data) => api('/admin/hackathons', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateHackathon: (id, data) => api(`/admin/hackathons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteHackathon: (id) => api(`/admin/hackathons/${id}`, { method: 'DELETE' }),

    // Types
    getTypes: () => api('/admin/types'),
    createType: (data) => api('/admin/types', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // Teams
    getTeams: (hackathonId) => api(`/admin/hackathons/${hackathonId}/teams`),
    createTeam: (data) => api('/admin/teams', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    deleteTeam: (id) => api(`/admin/teams/${id}`, { method: 'DELETE' }),

    // Participants
    getParticipants: (teamId) => api(`/admin/teams/${teamId}/participants`),

    // Judges
    getJudges: (hackathonId) => api(`/admin/judges?hackathon_id=${hackathonId}`),
    createJudge: (data) => api('/admin/judges', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    deleteJudge: (id) => api(`/admin/judges/${id}`, { method: 'DELETE' }),

    // Submissions & Scores
    getSubmissions: (hackathonId) => api(`/admin/hackathons/${hackathonId}/submissions`),
    getLeaderboard: (hackathonId) => api(`/admin/hackathons/${hackathonId}/leaderboard`),
    createScore: (data) => api('/admin/scores', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // Emails
    sendEmails: (data) => api('/admin/emails/send', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    getEmailLogs: () => api('/admin/emails/logs'),

    // Export
    exportHackathon: (hackathonId, format = 'csv') =>
        `${config.adminApi}/export/hackathons/${hackathonId}?format=${format}`,
};
