/**
 * Modal Component
 */

class Modal {
    constructor() {
        this.activeModal = null;
        this.backdrop = null;
        this.init();
    }

    init() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        this.backdrop.addEventListener('click', () => this.close());
        document.body.appendChild(this.backdrop);

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
    }

    /**
     * Open a modal
     * @param {string|HTMLElement} content - Modal HTML or element
     * @param {Object} options
     */
    open(content, options = {}) {
        const { size = '', onClose = null } = options;

        // Create modal container
        const modal = document.createElement('div');
        modal.className = `modal ${size}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        // Set content
        if (typeof content === 'string') {
            modal.innerHTML = `<div class="modal-content">${content}</div>`;
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'modal-content';
            wrapper.appendChild(content);
            modal.appendChild(wrapper);
        }

        // Setup close buttons
        modal.querySelectorAll('[data-modal-close]').forEach((btn) => {
            btn.addEventListener('click', () => this.close());
        });

        // Store callback
        modal._onClose = onClose;

        // Add to DOM
        document.body.appendChild(modal);
        this.activeModal = modal;

        // Show with animation
        requestAnimationFrame(() => {
            this.backdrop.classList.add('open');
            modal.classList.add('open');
        });

        // Focus trap
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) {
            focusable[0].focus();
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return modal;
    }

    /**
     * Close active modal
     */
    close() {
        if (!this.activeModal) return;

        const modal = this.activeModal;
        const onClose = modal._onClose;

        this.backdrop.classList.remove('open');
        modal.classList.remove('open');

        // Remove after animation
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
            if (onClose) onClose();
        }, 250);

        this.activeModal = null;
    }

    /**
     * Confirm dialog
     */
    confirm(options = {}) {
        const {
            title = 'Confirm',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            type = 'warning', // warning, danger, success
        } = options;

        return new Promise((resolve) => {
            const content = `
        <div class="modal-confirm">
          <div class="modal-body">
            <div class="modal-icon ${type}">
              ${this.getIcon(type)}
            </div>
            <p class="modal-message">${title}</p>
            <p class="modal-description">${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-modal-close>
              ${cancelText}
            </button>
            <button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}" data-confirm>
              ${confirmText}
            </button>
          </div>
        </div>
      `;

            const modal = this.open(content, {
                size: 'modal-sm',
                onClose: () => resolve(false),
            });

            modal.querySelector('[data-confirm]').addEventListener('click', () => {
                resolve(true);
                this.close();
            });
        });
    }

    getIcon(type) {
        const icons = {
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
            danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
        };
        return icons[type] || icons.warning;
    }
}

const modal = new Modal();
export default modal;
