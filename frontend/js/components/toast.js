/**
 * Toast Notification Component
 */

class Toast {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.container);

        // Add styles if not already present
        if (!document.getElementById('toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
        .toast-container {
          position: fixed;
          bottom: var(--space-6, 1.5rem);
          right: var(--space-6, 1.5rem);
          z-index: var(--z-toast, 600);
          display: flex;
          flex-direction: column;
          gap: var(--space-3, 0.75rem);
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: var(--space-3, 0.75rem);
          padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
          background: var(--bg-surface, #1f2937);
          border: 1px solid var(--border-default, rgba(75, 85, 99, 0.5));
          border-radius: var(--radius-xl, 1rem);
          box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
          color: var(--text-primary, #f9fafb);
          font-size: var(--text-sm, 0.875rem);
          pointer-events: auto;
          animation: toast-slide-in 0.3s ease-out;
        }

        .toast.removing {
          animation: toast-slide-out 0.2s ease-in forwards;
        }

        .toast-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .toast.success { border-color: var(--success, #10b981); }
        .toast.success .toast-icon { color: var(--success, #10b981); }

        .toast.error { border-color: var(--error, #ef4444); }
        .toast.error .toast-icon { color: var(--error, #ef4444); }

        .toast.warning { border-color: var(--warning, #f59e0b); }
        .toast.warning .toast-icon { color: var(--warning, #f59e0b); }

        .toast.info { border-color: var(--accent, #06b6d4); }
        .toast.info .toast-icon { color: var(--accent, #06b6d4); }

        .toast-close {
          margin-left: auto;
          padding: var(--space-1, 0.25rem);
          background: none;
          border: none;
          color: var(--text-muted, #6b7280);
          cursor: pointer;
          transition: color 0.15s;
        }

        .toast-close:hover { color: var(--text-primary, #f9fafb); }

        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes toast-slide-out {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `;
            document.head.appendChild(styles);
        }
    }

    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span class="toast-icon">${this.getIcon(type)}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    remove(toast) {
        if (!toast || toast.classList.contains('removing')) return;

        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 200);
    }

    getIcon(type) {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
        };
        return icons[type] || icons.info;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

const toast = new Toast();
export default toast;
