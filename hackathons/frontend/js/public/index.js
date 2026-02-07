/**
 * Hackathons Platform - Public Index Page
 */
(function () {
    let allHackathons = [];
    let currentFilter = 'all';

    // DOM Elements
    const grid = document.getElementById('hackathon-grid');
    const emptyState = document.getElementById('empty-state');
    const skeletons = document.getElementById('loading-skeletons');
    const filterTabs = document.getElementById('filter-tabs');

    // Initialize
    async function init() {
        bindFilters();
        await loadHackathons();
    }

    // Load hackathons from API
    async function loadHackathons() {
        try {
            showLoading(true);
            const response = await publicApi.getHackathons();
            allHackathons = response.data || [];
            renderHackathons();
        } catch (error) {
            console.error('Failed to load hackathons:', error);
            showError();
        } finally {
            showLoading(false);
        }
    }

    // Render hackathon cards
    function renderHackathons() {
        const filtered = filterHackathons(allHackathons, currentFilter);

        if (filtered.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        grid.innerHTML = filtered.map(createCard).join('');
    }

    // Filter hackathons
    function filterHackathons(hackathons, filter) {
        if (filter === 'all') return hackathons;
        return hackathons.filter(h => h.status === filter);
    }

    // Create hackathon card HTML
    function createCard(hackathon) {
        const statusClass = `status-badge--${hackathon.status}`;
        const cardClass = hackathon.status === 'live' ? 'hackathon-card--live' :
            hackathon.status === 'completed' ? 'hackathon-card--completed' : '';

        const startDate = new Date(hackathon.start_date);
        const endDate = new Date(hackathon.end_date);
        const regDeadline = hackathon.registration_deadline ? new Date(hackathon.registration_deadline) : null;

        const countdown = getCountdown(hackathon);

        return `
            <article class="hackathon-card ${cardClass}" data-status="${hackathon.status}">
                <div class="hackathon-card__header">
                    <span class="hackathon-card__type">
                        ${hackathon.hackathon_types?.name || 'Hackathon'}
                    </span>
                    <h3 class="hackathon-card__title">${escapeHtml(hackathon.title)}</h3>
                    <p class="hackathon-card__description">${escapeHtml(hackathon.description || '')}</p>
                </div>
                <div class="hackathon-card__body">
                    <div class="hackathon-card__dates">
                        <div class="hackathon-card__date">
                            <span>📅</span>
                            <span>${formatDate(startDate)} - ${formatDate(endDate)}</span>
                        </div>
                        ${regDeadline ? `
                        <div class="hackathon-card__date">
                            <span>⏰</span>
                            <span>Register by ${formatDate(regDeadline)}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="hackathon-card__stats">
                        <div class="hackathon-card__stat">
                            <span class="hackathon-card__stat-value">${hackathon.team_count || 0}</span>
                            <span class="hackathon-card__stat-label">Teams</span>
                        </div>
                        <div class="hackathon-card__stat">
                            <span class="hackathon-card__stat-value">${hackathon.submission_count || 0}</span>
                            <span class="hackathon-card__stat-label">Submissions</span>
                        </div>
                    </div>
                </div>
                <div class="hackathon-card__footer">
                    <span class="status-badge ${statusClass}">
                        ${hackathon.status === 'live' ? '<span class="status-badge__dot"></span>' : ''}
                        ${hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
                    </span>
                    ${countdown ? `<span class="hackathon-card__countdown">${countdown}</span>` : ''}
                    <a href="/hackathon.html?id=${hackathon.id}" class="btn btn--secondary btn--sm">
                        View Details
                    </a>
                </div>
            </article>
        `;
    }

    // Get countdown text
    function getCountdown(hackathon) {
        const now = new Date();
        const start = new Date(hackathon.start_date);
        const end = new Date(hackathon.end_date);
        const regDeadline = hackathon.registration_deadline ? new Date(hackathon.registration_deadline) : null;

        if (hackathon.status === 'upcoming' && regDeadline && regDeadline > now) {
            const diff = regDeadline - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days > 0) return `${days}d left to register`;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            return `${hours}h left to register`;
        }

        if (hackathon.status === 'live') {
            const diff = end - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours > 24) {
                const days = Math.floor(hours / 24);
                return `${days}d ${hours % 24}h remaining`;
            }
            return `${hours}h remaining`;
        }

        return null;
    }

    // Bind filter tab clicks
    function bindFilters() {
        filterTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-tab')) {
                // Update active state
                filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
                    tab.classList.remove('filter-tab--active');
                });
                e.target.classList.add('filter-tab--active');

                // Apply filter
                currentFilter = e.target.dataset.filter;
                renderHackathons();
            }
        });
    }

    // Show/hide loading state
    function showLoading(show) {
        skeletons.classList.toggle('hidden', !show);
        if (show) {
            grid.innerHTML = '';
            emptyState.classList.add('hidden');
        }
    }

    // Show error state
    function showError() {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">⚠️</div>
                <h3>Failed to load hackathons</h3>
                <p class="text-muted">Please try again later</p>
                <button class="btn btn--primary mt-4" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    // Utility functions
    function formatDate(date) {
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
})();
