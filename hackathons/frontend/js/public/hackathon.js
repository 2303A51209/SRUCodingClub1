/**
 * Hackathons Platform - Hackathon Details Page
 */
(function () {
    const loading = document.getElementById('loading');
    const detail = document.getElementById('hackathon-detail');
    const errorState = document.getElementById('error-state');

    async function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const hackathonId = urlParams.get('id');

        if (!hackathonId) {
            showError();
            return;
        }

        await loadHackathon(hackathonId);
    }

    async function loadHackathon(id) {
        try {
            const response = await publicApi.getHackathon(id);
            const hackathon = response.data;

            if (!hackathon) {
                showError();
                return;
            }

            // Update page title
            document.title = `${hackathon.title} | SR Coding Club`;

            renderHackathon(hackathon);
            loading.classList.add('hidden');
            detail.classList.remove('hidden');
        } catch (error) {
            console.error('Failed to load hackathon:', error);
            showError();
        }
    }

    function renderHackathon(hackathon) {
        const startDate = new Date(hackathon.start_date);
        const endDate = new Date(hackathon.end_date);
        const regDeadline = hackathon.registration_deadline ? new Date(hackathon.registration_deadline) : null;
        const regOpen = hackathon.registration_open;

        detail.innerHTML = `
            <header class="hackathon-detail__header">
                <span class="hackathon-detail__type">${hackathon.hackathon_types?.name || 'Hackathon'}</span>
                <h1 class="hackathon-detail__title">${escapeHtml(hackathon.title)}</h1>
                <div class="hackathon-detail__meta">
                    <span class="hackathon-detail__meta-item">
                        <span>📅</span>
                        <span>${formatDateRange(startDate, endDate)}</span>
                    </span>
                    <span class="hackathon-detail__meta-item">
                        <span>👥</span>
                        <span>Up to ${hackathon.max_team_size} members per team</span>
                    </span>
                    <span class="status-badge status-badge--${hackathon.status}">
                        ${hackathon.status === 'live' ? '<span class="status-badge__dot"></span>' : ''}
                        ${hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
                    </span>
                </div>
            </header>

            <div class="hackathon-detail__stats">
                <div class="hackathon-detail__stat">
                    <div class="hackathon-detail__stat-value">${hackathon.team_count || 0}</div>
                    <div class="hackathon-detail__stat-label">Teams Registered</div>
                </div>
                <div class="hackathon-detail__stat">
                    <div class="hackathon-detail__stat-value">${hackathon.submission_count || 0}</div>
                    <div class="hackathon-detail__stat-label">Submissions</div>
                </div>
                <div class="hackathon-detail__stat">
                    <div class="hackathon-detail__stat-value">${hackathon.judges?.length || 0}</div>
                    <div class="hackathon-detail__stat-label">Judges</div>
                </div>
            </div>

            <div class="hackathon-detail__content">
                <div class="hackathon-detail__main">
                    <div class="hackathon-detail__section">
                        <h3>About</h3>
                        <p>${escapeHtml(hackathon.description || 'No description provided.')}</p>
                    </div>

                    ${hackathon.rules ? `
                    <div class="hackathon-detail__section">
                        <h3>Rules & Guidelines</h3>
                        <p>${escapeHtml(hackathon.rules)}</p>
                    </div>
                    ` : ''}

                    ${hackathon.prizes ? `
                    <div class="hackathon-detail__section">
                        <h3>Prizes</h3>
                        <p>${escapeHtml(hackathon.prizes)}</p>
                    </div>
                    ` : ''}

                    ${hackathon.judges?.length > 0 ? `
                    <div class="hackathon-detail__section">
                        <h3>Judges</h3>
                        <div class="judges-list">
                            ${hackathon.judges.map(judge => `
                                <div class="judge-item">
                                    <div class="judge-item__avatar">${judge.name.charAt(0)}</div>
                                    <div>
                                        <div class="judge-item__name">${escapeHtml(judge.name)}</div>
                                        ${judge.expertise ? `<div class="judge-item__expertise">${escapeHtml(judge.expertise)}</div>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <aside class="hackathon-detail__sidebar">
                    <div class="hackathon-detail__register-card">
                        <h3>Registration</h3>
                        ${regDeadline ? `
                        <p class="text-muted mb-4">
                            Deadline: ${formatDate(regDeadline)}
                        </p>
                        ` : ''}
                        ${regOpen ? `
                        <p class="registration-badge registration-badge--open mb-4">
                            ✓ Registration Open
                        </p>
                        <a href="/register.html?hackathon=${hackathon.id}" class="btn btn--primary btn--lg" style="width: 100%">
                            Register Your Team
                        </a>
                        ` : `
                        <p class="registration-badge registration-badge--closed mb-4">
                            ✕ Registration Closed
                        </p>
                        <button class="btn btn--secondary btn--lg" style="width: 100%" disabled>
                            Registration Closed
                        </button>
                        `}
                    </div>
                </aside>
            </div>
        `;
    }

    function showError() {
        loading.classList.add('hidden');
        detail.classList.add('hidden');
        errorState.classList.remove('hidden');
    }

    function formatDateRange(start, end) {
        const startStr = start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-IN', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', init);
})();
