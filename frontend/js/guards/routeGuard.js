/**
 * Route Guard
 * Protects routes based on authentication and roles
 */

import auth from '../core/auth.js';

class RouteGuard {
    /**
     * Check if user can access current route
     * @param {Object} options
     * @param {boolean} options.requireAuth - Require authentication
     * @param {string[]} options.roles - Required roles (any match)
     * @param {string} options.redirectTo - Redirect URL if unauthorized
     */
    async check(options = {}) {
        const {
            requireAuth = true,
            roles = [],
            redirectTo = '/login.html',
            unauthorizedRedirect = '/unauthorized.html',
        } = options;

        // Initialize auth state
        await auth.init();

        // Check authentication
        if (requireAuth && !auth.isAuthenticated()) {
            const returnUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `${redirectTo}?returnUrl=${returnUrl}`;
            return false;
        }

        // Check roles
        if (roles.length > 0 && !auth.hasRole(roles)) {
            window.location.href = unauthorizedRedirect;
            return false;
        }

        return true;
    }

    /**
     * Protect a page - call at the start of protected pages
     */
    async protect(roles = []) {
        return this.check({ requireAuth: true, roles });
    }

    /**
     * Redirect authenticated users away from auth pages
     */
    async redirectIfAuthenticated(to = '/') {
        await auth.init();

        if (auth.isAuthenticated()) {
            const user = auth.getUser();
            // Redirect based on role
            const dashboardUrl = this.getDashboardUrl(user.role);
            window.location.href = to || dashboardUrl;
            return true;
        }

        return false;
    }

    /**
     * Get dashboard URL based on role
     */
    getDashboardUrl(role) {
        switch (role) {
            case 'admin':
                return '/dashboards/admin/index.html';
            case 'team':
                return '/dashboards/team/index.html';
            default:
                return '/dashboards/member/index.html';
        }
    }

    /**
     * Auto-protect current page based on path
     */
    async autoProtect() {
        const path = window.location.pathname;

        // Admin dashboard
        if (path.startsWith('/dashboards/admin')) {
            return this.check({ roles: ['admin'] });
        }

        // Team dashboard
        if (path.startsWith('/dashboards/team')) {
            return this.check({ roles: ['admin', 'team'] });
        }

        // Member dashboard
        if (path.startsWith('/dashboards/member')) {
            return this.check({ requireAuth: true });
        }

        // Profile page
        if (path.includes('/profile')) {
            return this.check({ requireAuth: true });
        }

        return true;
    }
}

const routeGuard = new RouteGuard();
export default routeGuard;
