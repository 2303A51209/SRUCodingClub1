import store from '../core/store.js';
import auth from '../core/auth.js';
import { escapeHtml } from '../utils/security.js';

class HeaderAuth {
    constructor() {
        this.container = document.getElementById('auth-actions');
        if (!this.container) {
            // Safe fallback if element is missing
            return;
        }

        // Initialize and subscribe
        this.render(store.getState());
        store.subscribe((state) => this.render(state));

        // Global click listener for dropdowns
        document.addEventListener('click', (e) => this.handleGlobalClick(e));

        // Ensure auth is initialized if not already
        if (!auth.initialized) {
            auth.init();
        }
    }

    handleGlobalClick(e) {
        const menu = this.container.querySelector('.user-menu');
        // Close if click is outside menu and menu is open
        if (menu && menu.classList.contains('open')) {
            if (!menu.contains(e.target)) {
                menu.classList.remove('open');
                const trigger = menu.querySelector('.user-menu-trigger');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            }
        }
    }

    getDashboardLink(user) {
        const role = user?.role || 'member';
        // Map roles to dashboard paths
        const rolePaths = {
            'admin': '/dashboards/admin/index.html',
            'team': '/dashboards/team/index.html',
            'member': '/dashboards/member/index.html'
        };
        return rolePaths[role] || rolePaths['member'];
    }

    render(state) {
        const { isAuthenticated, user } = state;

        if (isAuthenticated && user) {
            this.renderAuthenticated(user);
        } else {
            this.renderGuest();
        }
    }

    renderGuest() {
        this.container.innerHTML = `
            <a href="./login.html" class="btn btn-ghost btn-sm">Sign in</a>
            <a href="./join.html" class="btn btn-primary btn-sm">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                    <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z" />
                </svg>
                Join
            </a>
        `;
    }

    renderAuthenticated(user) {
        // Initials or Avatar
        const initials = this.getInitials(user.full_name || user.email);
        const avatarUrl = user.avatar_url;

        this.container.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-trigger" aria-expanded="false" aria-label="User menu">
                    ${avatarUrl ?
                `<img src="${escapeHtml(avatarUrl)}" alt="User avatar" class="user-avatar">` :
                `<div class="user-initials">${escapeHtml(initials)}</div>`
            }
                </button>
                <div class="user-menu-dropdown">
                    <div class="dropdown-header">
                        <span class="user-name">${escapeHtml(user.full_name || 'User')}</span>
                        <span class="user-email">${escapeHtml(user.email)}</span>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="${this.getDashboardLink(user)}" class="user-menu-item">
                        Dashboard
                    </a>
                    
                    <div class="dropdown-divider"></div>
                    <button id="logout-btn" class="user-menu-item danger" style="width:100%;text-align:left;background:none;border:none;cursor:pointer;">
                        Sign out
                    </button>
                </div>
            </div>
        `;

        // Bind events
        const trigger = this.container.querySelector('.user-menu-trigger');
        const menu = this.container.querySelector('.user-menu');
        const logoutBtn = this.container.querySelector('#logout-btn');

        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Toggle open class
                menu.classList.toggle('open');
                const isOpen = menu.classList.contains('open');
                trigger.setAttribute('aria-expanded', isOpen);
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await auth.logout();
            });
        }
    }

    getInitials(name) {
        if (!name) return '??';
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }
}

// Initialize
const headerAuth = new HeaderAuth();
export default headerAuth;
