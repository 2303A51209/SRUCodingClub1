/**
 * Loader Component
 */

class Loader {
    constructor() {
        this.pageLoader = null;
        this.overlayLoader = null;
    }

    /**
     * Show page loader (full screen)
     */
    showPage() {
        if (this.pageLoader) return;

        this.pageLoader = document.createElement('div');
        this.pageLoader.className = 'page-loader';
        this.pageLoader.innerHTML = `
      <div class="loader-logo">
        <svg viewBox="0 0 40 40" width="64" height="64">
          <circle cx="20" cy="20" r="18" fill="none" stroke="url(#loader-gradient)" stroke-width="3" stroke-linecap="round">
            <animate attributeName="stroke-dasharray" values="0 200;100 200;0 200" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" values="0;-50;-200" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <defs>
            <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:var(--primary, #7c3aed)"/>
              <stop offset="100%" style="stop-color:var(--accent, #06b6d4)"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p class="loader-text">Loading...</p>
    `;

        document.body.appendChild(this.pageLoader);
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide page loader
     */
    hidePage() {
        if (!this.pageLoader) return;

        this.pageLoader.style.opacity = '0';
        setTimeout(() => {
            this.pageLoader?.remove();
            this.pageLoader = null;
            document.body.style.overflow = '';
        }, 300);
    }

    /**
     * Show overlay loader (inside a container)
     */
    showOverlay(container) {
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        if (!element) return;

        const overlay = document.createElement('div');
        overlay.className = 'loader-overlay';
        overlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      border-radius: inherit;
      z-index: 10;
    `;
        overlay.innerHTML = '<div class="spinner spinner-lg"></div>';

        element.style.position = 'relative';
        element.appendChild(overlay);

        return overlay;
    }

    /**
     * Hide overlay loader
     */
    hideOverlay(overlay) {
        if (!overlay) return;

        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    }

    /**
     * Button loading state
     */
    buttonLoading(button, loading = true) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) return;

        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
            btn.dataset.originalText = btn.innerHTML;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
            if (btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
        }
    }
}

const loader = new Loader();
export default loader;
