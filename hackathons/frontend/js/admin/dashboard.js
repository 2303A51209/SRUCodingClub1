/**
 * Hackathons Platform - Admin Dashboard
 */
(function () {
    let currentSection = 'overview';
    let hackathons = [];
    let user = null;

    // Initialize
    async function init() {
        await checkAuth();
        bindNavigation();
        bindLogout();
        bindExport();
        await loadOverview();
    }

    // Check authentication
    async function checkAuth() {
        try {
            const response = await adminApi.getMe();
            user = response.data;
            document.getElementById('user-name').textContent = user.name || user.email;
        } catch (error) {
            window.location.href = '/admin/login.html';
        }
    }

    // Navigation
    function bindNavigation() {
        document.querySelectorAll('.admin-nav__item[data-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                showSection(section);
            });
        });
    }

    window.showSection = function (section) {
        currentSection = section;

        // Update nav
        document.querySelectorAll('.admin-nav__item').forEach(btn => {
            btn.classList.remove('admin-nav__item--active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('admin-nav__item--active');

        // Update sections
        document.querySelectorAll('[id$="-section"]').forEach(el => {
            el.classList.add('hidden');
        });
        document.getElementById(`${section}-section`)?.classList.remove('hidden');

        // Update title
        const titles = {
            overview: 'Dashboard Overview',
            hackathons: 'Manage Hackathons',
            teams: 'Registered Teams',
            judges: 'Judges',
            submissions: 'Submissions',
            emails: 'Email Notifications',
            export: 'Data Export'
        };
        document.getElementById('section-title').textContent = titles[section] || 'Dashboard';

        // Load section data
        loadSectionData(section);
    };

    async function loadSectionData(section) {
        switch (section) {
            case 'hackathons':
                await loadHackathons();
                break;
            case 'teams':
                await populateHackathonDropdowns();
                break;
            case 'judges':
                await loadJudges();
                break;
            case 'submissions':
                await populateHackathonDropdowns();
                break;
            case 'emails':
                await loadEmailLogs();
                break;
            case 'export':
                await populateHackathonDropdowns();
                break;
        }
    }

    // Overview
    async function loadOverview() {
        try {
            const response = await adminApi.getHackathons();
            hackathons = response.data || [];

            // Stats
            document.getElementById('stat-hackathons').textContent = hackathons.length;

            let totalTeams = 0;
            let totalParticipants = 0;
            let totalSubmissions = 0;

            // Get detailed counts for each hackathon
            for (const h of hackathons) {
                const teamsResponse = await adminApi.getTeams(h.id);
                const teams = teamsResponse.data || [];
                totalTeams += teams.length;
                teams.forEach(t => {
                    totalParticipants += (t.participants?.length || 0);
                });

                const subResponse = await adminApi.getSubmissions(h.id);
                totalSubmissions += (subResponse.data?.length || 0);
            }

            document.getElementById('stat-teams').textContent = totalTeams;
            document.getElementById('stat-participants').textContent = totalParticipants;
            document.getElementById('stat-submissions').textContent = totalSubmissions;

            // Recent hackathons table
            renderRecentHackathons();
        } catch (error) {
            console.error('Failed to load overview:', error);
        }
    }

    function renderRecentHackathons() {
        const tbody = document.querySelector('#recent-hackathons-table tbody');
        const recent = hackathons.slice(0, 5);

        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hackathons yet</td></tr>';
            return;
        }

        tbody.innerHTML = recent.map(h => `
            <tr>
                <td>${escapeHtml(h.title)}</td>
                <td><span class="status-badge status-badge--${h.status}">${h.status}</span></td>
                <td>-</td>
                <td>
                    <div class="table-actions">
                        <button class="table-action" onclick="editHackathon('${h.id}')">Edit</button>
                        <button class="table-action" onclick="viewHackathon('${h.id}')">View</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Hackathons
    async function loadHackathons() {
        try {
            const response = await adminApi.getHackathons();
            hackathons = response.data || [];

            const tbody = document.querySelector('#hackathons-table tbody');

            if (hackathons.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hackathons yet</td></tr>';
                return;
            }

            tbody.innerHTML = hackathons.map(h => `
                <tr>
                    <td>${escapeHtml(h.title)}</td>
                    <td>${h.hackathon_types?.name || '-'}</td>
                    <td><span class="status-badge status-badge--${h.status}">${h.status}</span></td>
                    <td>${formatDate(new Date(h.start_date))}</td>
                    <td>-</td>
                    <td>
                        <div class="table-actions">
                            <button class="table-action" onclick="editHackathon('${h.id}')">Edit</button>
                            <button class="table-action table-action--danger" onclick="deleteHackathon('${h.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Failed to load hackathons:', error);
        }
    }

    // Judges
    async function loadJudges() {
        try {
            const response = await adminApi.getJudges();
            const judges = response.data || [];

            const tbody = document.querySelector('#judges-table tbody');

            if (judges.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No judges yet</td></tr>';
                return;
            }

            tbody.innerHTML = judges.map(j => `
                <tr>
                    <td>${escapeHtml(j.name)}</td>
                    <td>${escapeHtml(j.email)}</td>
                    <td>${escapeHtml(j.expertise || '-')}</td>
                    <td>-</td>
                    <td>
                        <div class="table-actions">
                            <button class="table-action table-action--danger" onclick="deleteJudge('${j.id}')">Remove</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Failed to load judges:', error);
        }
    }

    // Email Logs
    async function loadEmailLogs() {
        try {
            const response = await adminApi.getEmailLogs();
            const logs = response.data || [];

            const tbody = document.querySelector('#email-logs-table tbody');

            if (logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No emails sent yet</td></tr>';
                return;
            }

            tbody.innerHTML = logs.map(log => `
                <tr>
                    <td>${escapeHtml(log.subject)}</td>
                    <td>${escapeHtml(log.template)}</td>
                    <td>${log.recipients_count}</td>
                    <td>${formatDateTime(new Date(log.sent_at))}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Failed to load email logs:', error);
        }
    }

    // Populate hackathon dropdowns
    async function populateHackathonDropdowns() {
        if (hackathons.length === 0) {
            try {
                const response = await adminApi.getHackathons();
                hackathons = response.data || [];
            } catch (e) { }
        }

        const options = hackathons.map(h => `<option value="${h.id}">${escapeHtml(h.title)}</option>`).join('');

        ['teams-hackathon-filter', 'submissions-hackathon-filter', 'export-hackathon'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = '<option value="">Select Hackathon</option>' + options;
            }
        });
    }

    // Export
    function bindExport() {
        document.getElementById('export-btn')?.addEventListener('click', () => {
            const hackathonId = document.getElementById('export-hackathon').value;
            const format = document.querySelector('input[name="export-format"]:checked')?.value || 'csv';

            if (!hackathonId) {
                alert('Please select a hackathon');
                return;
            }

            window.location.href = adminApi.exportHackathon(hackathonId, format);
        });
    }

    // Logout
    function bindLogout() {
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            try {
                await adminApi.logout();
            } catch (e) { }
            window.location.href = '/admin/login.html';
        });
    }

    // Placeholder action functions
    window.editHackathon = function (id) { alert('Edit hackathon: ' + id); };
    window.viewHackathon = function (id) { window.open('/hackathon.html?id=' + id); };
    window.deleteHackathon = async function (id) {
        if (confirm('Delete this hackathon?')) {
            await adminApi.deleteHackathon(id);
            loadHackathons();
        }
    };
    window.deleteJudge = async function (id) {
        if (confirm('Remove this judge?')) {
            await adminApi.deleteJudge(id);
            loadJudges();
        }
    };

    // Utilities
    function formatDate(date) {
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatDateTime(date) {
        return date.toLocaleDateString('en-IN', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', init);
})();
