/**
 * App Entry Point
 * Initializes core functionality and global components
 */

import store from './core/store.js';
import auth from './core/auth.js';
import { ready, initScrollAnimations, $, $$ } from './utils/dom.js';

class App {
    constructor() {
        this.initialized = false;
        this.abortController = null; // For event listener cleanup
    }

    async init() {
        if (this.initialized) return;

        // Initialize theme
        store.initTheme();

        // Initialize scroll animations
        initScrollAnimations();

        // Setup theme toggle
        this.setupThemeToggle();

        // Setup mobile menu
        this.setupMobileMenu();

        // Setup user menu (if authenticated areas)
        this.setupUserMenu();

        this.initialized = true;
    }

    /**
     * Setup theme toggle button
     */
    setupThemeToggle() {
        const toggleBtn = $('.theme-toggle');
        if (!toggleBtn) return;

        // Update icon based on current theme
        const updateIcon = () => {
            const isDark = store.getState().theme === 'dark';
            toggleBtn.innerHTML = isDark
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
        };

        updateIcon();

        toggleBtn.addEventListener('click', () => {
            store.toggleTheme();
            updateIcon();
        });

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                store.setState({ theme: e.matches ? 'dark' : 'light' });
                document.documentElement.setAttribute('data-theme', store.getState().theme);
                updateIcon();
            }
        });
    }

    /**
     * Setup mobile menu toggle
     */
    setupMobileMenu() {
        const menuToggle = $('.mobile-menu-toggle');
        const navMain = $('.nav-main');

        if (!menuToggle || !navMain) return;

        menuToggle.addEventListener('click', () => {
            navMain.classList.toggle('open');
            const isOpen = navMain.classList.contains('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header') && navMain.classList.contains('open')) {
                navMain.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /**
     * Setup user dropdown menu
     */
    setupUserMenu() {
        const userMenu = $('.user-menu');
        if (!userMenu) return;

        const trigger = userMenu.querySelector('.user-menu-trigger');

        trigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userMenu.classList.remove('open');
            }
        });

        // Logout handler
        const logoutBtn = userMenu.querySelector('[data-logout]');
        logoutBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await auth.logout();
        });
    }
}

// Create and export app instance
const app = new App();

// Initialize on DOM ready
ready(() => app.init());

export default app;
