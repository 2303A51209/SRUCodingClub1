
import dataService from '../core/data.js';

// Elements
const elCommits = document.getElementById('stat-commits');
const elProjects = document.getElementById('stat-projects');
const elMembers = document.getElementById('stat-members');
const elTerminalBody = document.getElementById('terminal-body');

// Mock data for commits until we have GitHub integration
const TOTAL_COMMITS = 3492;

// Init
async function init() {
    loadStats();
    loadActivityFeed();
}

// Load Stats
async function loadStats() {
    try {
        // 1. Projects Count
        const projects = await dataService.getProjects({ limit: 1 });
        // projects could be array or object with pagination
        const projectCount = Array.isArray(projects) ? projects.length : (projects.pagination?.total || projects.data?.length || 0);

        if (elProjects) animateNumber(elProjects, projectCount);

        // 2. Members Count
        // We don't have a direct public "total members" count endpoint that is efficient,
        // but /users/team returns team members. Real total members is admin only.
        // For now, let's show 150+ hardcoded or simulate based on team size * multiplier?
        // Or just leave hardcoded if we can't get it.
        // Let's try to get team members count at least.
        const team = await dataService.getTeamMembers();
        const teamCount = Array.isArray(team) ? team.length : 0;

        // If we want "Contributors" to be "Members", we might need a public /stats endpoint.
        // But let's just stick to what we have. If 0, stick to default HTML value.
        if (teamCount > 0 && elMembers) {
            // Maybe show "X Team Members" or just leave the hardcoded "150+ Contributors"
            // actually, let's not update members if we can't get real number
        }

        // 3. Commits - Hardcoded for now
        if (elCommits) animateNumber(elCommits, TOTAL_COMMITS);

    } catch (e) {
        console.error('Failed to load stats', e);
    }
}

// Load Activity Feed (from Announcements & Events)
async function loadActivityFeed() {
    if (!elTerminalBody) return;

    try {
        const [announcementsRes, eventsRes] = await Promise.all([
            dataService.getAnnouncements({ limit: 5 }),
            dataService.getEvents({ limit: 5 }) // This might return {events: [...]} or []
        ]);

        const announcements = Array.isArray(announcementsRes) ? announcementsRes : (announcementsRes.data || []);

        // Handle events response format (array or object)
        const eventsList = eventsRes.events || (Array.isArray(eventsRes) ? eventsRes : []) || [];

        // Merge and sort
        const activities = [
            ...announcements.map(a => ({
                type: 'announcement',
                title: a.title,
                date: new Date(a.created_at),
                message: `📢 Announcement: ${a.title}`
            })),
            ...eventsList.map(e => ({
                type: 'event',
                title: e.title,
                date: new Date(e.created_at || e.start_date), // Use creation or start date
                message: `📅 Event: ${e.title} (${new Date(e.start_date).toLocaleDateString()})`
            }))
        ]
            .sort((a, b) => b.date - a.date)
            .slice(0, 6);

        if (activities.length === 0) return; // Keep default if empty

        // Render to terminal
        elTerminalBody.innerHTML = activities.map(item => `
            <div class="terminal-line terminal-output">
                <span class="terminal-git-log">
                    <span class="terminal-git-hash">${Math.random().toString(16).substring(2, 9)}</span>
                    <span class="terminal-git-message">${escapeHtml(item.message)}</span>
                </span>
            </div>
        `).join('') + `
            <div class="terminal-line">
                <span class="terminal-prompt">$</span>
                <span class="terminal-cursor"></span>
            </div>
        `;

    } catch (e) {
        console.error('Failed to load activity', e);
    }
}

function animateNumber(element, target) {
    if (!element) return;
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quart
        const ease = 1 - Math.pow(1 - progress, 4);

        const current = Math.floor(start + (target - start) * ease);
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Start
init();
