/**
 * Client-Side Router
 * Simple hash-based or history-based navigation
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.notFoundHandler = null;
    }

    /**
     * Register a route
     */
    on(path, handler) {
        this.routes.set(path, handler);
        return this;
    }

    /**
     * Set 404 handler
     */
    notFound(handler) {
        this.notFoundHandler = handler;
        return this;
    }

    /**
     * Navigate to a path
     */
    navigate(path) {
        window.location.href = path;
    }

    /**
     * Get current path
     */
    getCurrentPath() {
        return window.location.pathname;
    }

    /**
     * Initialize router (for SPA sections)
     */
    init() {
        // Handle initial load
        this.handleRoute();

        // Listen for popstate (back/forward)
        window.addEventListener('popstate', () => this.handleRoute());

        // Intercept link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-link]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('href');
                window.history.pushState({}, '', path);
                this.handleRoute();
            }
        });
    }

    /**
     * Handle current route
     */
    handleRoute() {
        const path = this.getCurrentPath();
        const handler = this.routes.get(path);

        if (handler) {
            handler();
        } else if (this.notFoundHandler) {
            this.notFoundHandler();
        }
    }
}

const router = new Router();
export default router;
