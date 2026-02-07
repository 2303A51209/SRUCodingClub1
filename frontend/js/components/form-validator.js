/**
 * Form Validator
 * Client-side form validation
 */

class FormValidator {
    constructor(form, options = {}) {
        this.form = typeof form === 'string' ? document.querySelector(form) : form;
        this.options = {
            errorClass: 'error',
            successClass: 'success',
            showErrors: true,
            ...options,
        };
        this.rules = new Map();
        this.init();
    }

    init() {
        if (!this.form) return;

        this.form.setAttribute('novalidate', '');

        // Validate on submit
        this.form.addEventListener('submit', (e) => {
            if (!this.validate()) {
                e.preventDefault();
            }
        });

        // Validate on blur
        this.form.querySelectorAll('input, textarea, select').forEach((field) => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearError(field));
        });
    }

    /**
     * Add validation rules for a field
     */
    addRule(fieldName, rules) {
        this.rules.set(fieldName, rules);
        return this;
    }

    /**
     * Validate entire form
     */
    validate() {
        let isValid = true;

        this.rules.forEach((rules, fieldName) => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validate a single field
     */
    validateField(field) {
        const rules = this.rules.get(field.name);
        if (!rules) return true;

        const value = field.value.trim();

        for (const rule of rules) {
            const error = this.checkRule(rule, value, field);
            if (error) {
                this.showError(field, error);
                return false;
            }
        }

        this.showSuccess(field);
        return true;
    }

    /**
     * Check a single rule
     */
    checkRule(rule, value, field) {
        if (typeof rule === 'function') {
            return rule(value, field);
        }

        const { type, message, param } = rule;

        switch (type) {
            case 'required':
                if (!value) return message || 'This field is required';
                break;

            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return message || 'Please enter a valid email';
                }
                break;

            case 'minLength':
                if (value && value.length < param) {
                    return message || `Must be at least ${param} characters`;
                }
                break;

            case 'maxLength':
                if (value && value.length > param) {
                    return message || `Must be less than ${param} characters`;
                }
                break;

            case 'pattern':
                if (value && !param.test(value)) {
                    return message || 'Invalid format';
                }
                break;

            case 'match':
                const matchField = this.form.querySelector(`[name="${param}"]`);
                if (matchField && value !== matchField.value.trim()) {
                    return message || 'Fields do not match';
                }
                break;

            case 'password':
                if (value) {
                    if (!/[A-Z]/.test(value)) return message || 'Must contain an uppercase letter';
                    if (!/[a-z]/.test(value)) return message || 'Must contain a lowercase letter';
                    if (!/[0-9]/.test(value)) return message || 'Must contain a number';
                    if (value.length < 8) return message || 'Must be at least 8 characters';
                }
                break;
        }

        return null;
    }

    /**
     * Show error on field
     */
    showError(field, message) {
        this.clearStatus(field);
        field.classList.add(this.options.errorClass);

        if (this.options.showErrors) {
            const errorEl = document.createElement('span');
            errorEl.className = 'form-error';
            errorEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
        ${message}
      `;
            field.parentNode.appendChild(errorEl);
        }
    }

    /**
     * Show success on field
     */
    showSuccess(field) {
        this.clearStatus(field);
        field.classList.add(this.options.successClass);
    }

    /**
     * Clear error from field
     */
    clearError(field) {
        this.clearStatus(field);
    }

    /**
     * Clear all status from field
     */
    clearStatus(field) {
        field.classList.remove(this.options.errorClass, this.options.successClass);
        const errorEl = field.parentNode.querySelector('.form-error');
        if (errorEl) errorEl.remove();
    }

    /**
     * Get form data as object
     */
    getFormData() {
        const formData = new FormData(this.form);
        return Object.fromEntries(formData.entries());
    }

    /**
     * Reset form and validation
     */
    reset() {
        this.form.reset();
        this.form.querySelectorAll('input, textarea, select').forEach((field) => {
            this.clearStatus(field);
        });
    }
}

export default FormValidator;
