/**
 * Security Utilities
 * XSS Prevention and Input Sanitization
 */

/**
 * HTML entities map
 */
const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

/**
 * Escape HTML special characters
 */
export const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') return String(str);
    return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char]);
};

/**
 * Sanitize user input for safe rendering
 */
export const sanitize = (input) => {
    if (typeof input !== 'string') return input;

    // Remove script tags and event handlers
    let clean = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, 'data-removed=')
        .replace(/javascript:/gi, 'removed:');

    // Escape remaining HTML
    return escapeHtml(clean);
};

/**
 * Create safe HTML from template (use with caution)
 * Only use for trusted sources or after sanitization
 */
export const safeHtml = (strings, ...values) => {
    let result = strings[0];
    for (let i = 1; i < strings.length; i++) {
        const value = values[i - 1];
        const sanitizedValue = typeof value === 'string' ? escapeHtml(value) : (value ?? '');
        result += sanitizedValue + strings[i];
    }
    return result;
};

/**
 * Strip all HTML tags
 */
export const stripTags = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '');
};

/**
 * Validate and sanitize URL
 */
export const sanitizeUrl = (url) => {
    if (!url) return '';

    // Only allow http, https, and relative URLs
    const trimmed = url.trim();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
        return '';
    }

    try {
        const parsed = new URL(trimmed, window.location.origin);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }
        return parsed.href;
    } catch {
        // Relative URL
        if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
            return trimmed;
        }
        return '';
    }
};

/**
 * Generate a random token
 */
export const generateToken = (length = 32) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hash a string (for non-security purposes)
 */
export const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};
