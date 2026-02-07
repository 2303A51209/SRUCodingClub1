/**
 * Hackathons Platform - Theme Manager
 */
const ThemeManager = {
    STORAGE_KEY: 'hackathons-theme',

    init() {
        // Check for saved preference or system preference
        const saved = localStorage.getItem(this.STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');

        this.setTheme(theme);
        this.bindToggle();

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);

        // Update toggle button icons
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach(toggle => {
            const lightIcon = toggle.querySelector('.theme-toggle__light');
            const darkIcon = toggle.querySelector('.theme-toggle__dark');
            if (lightIcon) lightIcon.style.display = theme === 'dark' ? 'block' : 'none';
            if (darkIcon) darkIcon.style.display = theme === 'light' ? 'block' : 'none';
        });
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    },

    bindToggle() {
        document.querySelectorAll('.theme-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.toggle());
        });
    },

    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
