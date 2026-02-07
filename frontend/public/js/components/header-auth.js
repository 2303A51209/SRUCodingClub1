/**
 * Header Auth Module
 * Handles auth-aware navigation UI across all public pages
 */
import auth from '../core/auth.js';

/**
 * Get user initials from name
 */
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardUrl(role) {
    switch (role) {
        case 'admin':
            return './dashboards/admin/index.html';
        case 'team':
            return './dashboards/team/index.html';
        default:
            return './dashboards/member/index.html';
    }
}

/**
 * Initialize auth-aware header navigation
 */
export async function initHeaderAuth() {
    const guestNav = document.getElementById('guest-nav');
    const userNav = document.getElementById('user-nav');

    if (!guestNav || !userNav) {
        console.warn('Header auth elements not found');
        return;
    }

    try {
        const user = await auth.init();

        if (user && auth.isAuthenticated()) {
            // User is logged in - show user menu
            guestNav.style.display = 'none';
            userNav.style.display = 'block';

            // Set user initials
            const initialsEl = document.getElementById('user-initials');
            if (initialsEl) {
                initialsEl.textContent = getInitials(user.full_name || user.email);
            }

            // Set avatar if available
            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl && user.avatar_url) {
                avatarEl.src = user.avatar_url;
                avatarEl.style.display = 'block';
                if (initialsEl) initialsEl.style.display = 'none';
            }

            // Set dashboard link based on role
            const dashboardLink = document.getElementById('dashboard-link');
            if (dashboardLink) {
                dashboardLink.href = getDashboardUrl(user.role);
            }

            // Set profile link
            const profileLink = document.getElementById('profile-link');
            if (profileLink) {
                profileLink.href = getDashboardUrl(user.role) + '?tab=profile';
            }

            // Setup dropdown toggle
            setupDropdownToggle();

            // Setup logout
            setupLogout();

        } else {
            // User is not logged in - show guest nav
            guestNav.style.display = 'flex';
            userNav.style.display = 'none';
        }
    } catch (error) {
        console.log('Header auth init failed:', error);
        // Default to guest nav
        guestNav.style.display = 'flex';
        userNav.style.display = 'none';
    }
}

/**
 * Setup dropdown toggle behavior
 */
function setupDropdownToggle() {
    const userMenu = document.getElementById('user-nav');
    const trigger = userMenu?.querySelector('.user-menu-trigger');

    if (!trigger || !userMenu) return;

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = userMenu.classList.contains('open');
        userMenu.classList.toggle('open');
        trigger.setAttribute('aria-expanded', !isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
            userMenu.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && userMenu.classList.contains('open')) {
            userMenu.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        }
    });
}

/**
 * Setup logout functionality
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');

    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await auth.logout();
        } catch (error) {
            console.error('Logout failed:', error);
            // Force redirect anyway
            window.location.href = './login.html';
        }
    });
}

export default { initHeaderAuth };
