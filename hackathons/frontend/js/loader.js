/**
 * Hackathons Platform - ASCII Loader
 */
const Loader = {
    messages: {
        boot: 'BOOTING HACKATHON SYSTEM',
        sync: 'SYNCING DATA STREAM',
        action: 'EXECUTING ADMIN ACTION',
        export: 'COMPILING DATA EXPORT',
        email: 'TRANSMITTING PAYLOAD',
    },

    /**
     * Show the ASCII loader
     * @param {string} type - Loader message type
     * @param {number} duration - Max duration in ms (default 1200)
     */
    show(type = 'sync', duration = 1200) {
        const message = this.messages[type] || this.messages.sync;

        // Create loader element
        const loader = document.createElement('div');
        loader.id = 'ascii-loader';
        loader.className = 'ascii-loader';
        loader.innerHTML = `
            <div class="ascii-loader__box">
                <div class="ascii-loader__content">
                    <div class="ascii-loader__message">${message}</div>
                    <div class="ascii-loader__progress">
                        ${Array(16).fill('<div class="ascii-loader__bar"></div>').join('')}
                    </div>
                    <div class="ascii-loader__status">STATUS: PROCESSING<span class="ascii-loader__cursor"></span></div>
                </div>
            </div>
        `;

        document.body.appendChild(loader);

        // Auto-hide after duration
        this._hideTimeout = setTimeout(() => this.hide(), duration);

        return loader;
    },

    /**
     * Hide the loader
     */
    hide() {
        const loader = document.getElementById('ascii-loader');
        if (loader) {
            loader.classList.add('ascii-loader--hidden');
            setTimeout(() => loader.remove(), 300);
        }
        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
        }
    },

    /**
     * Show inline loader for buttons/actions
     * @param {HTMLElement} container - Container element
     * @param {string} text - Loading text
     */
    showInline(container, text = 'Processing') {
        const loader = document.createElement('span');
        loader.className = 'inline-loader';
        loader.innerHTML = `
            ${text}
            <span class="inline-loader__dots">
                <span class="inline-loader__dot"></span>
                <span class="inline-loader__dot"></span>
                <span class="inline-loader__dot"></span>
            </span>
        `;
        container.innerHTML = '';
        container.appendChild(loader);
        return loader;
    },
};

// Show boot loader on first page load
document.addEventListener('DOMContentLoaded', () => {
    // Only show on first load, not on navigation
    if (!sessionStorage.getItem('hackathons-loaded')) {
        Loader.show('boot', 1200);
        sessionStorage.setItem('hackathons-loaded', 'true');
    }
});
