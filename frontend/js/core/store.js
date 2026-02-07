/**
 * Simple State Management
 * Reactive store with subscribers
 */

class Store {
    constructor(initialState = {}) {
        this.state = {
            user: null,
            isAuthenticated: false,
            theme: this.getInitialTheme(),
            ...initialState,
        };
        this.listeners = new Set();
    }

    /**
     * Get initial theme from localStorage or system preference
     */
    getInitialTheme() {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;

        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update state
     */
    setState(partial) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...partial };
        this.notify(prevState);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all subscribers
     */
    notify(prevState) {
        this.listeners.forEach((listener) => {
            try {
                listener(this.state, prevState);
            } catch (error) {
                console.error('Store listener error:', error);
            }
        });
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.setState({ theme: newTheme });
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    }

    /**
     * Initialize theme on page load
     */
    initTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
    }
}

const store = new Store();
export default store;
