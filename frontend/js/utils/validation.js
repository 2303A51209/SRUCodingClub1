/**
 * Validation Utilities
 */

export const isEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isPhone = (value) => {
    return /^[\d\s\-\+\(\)]{10,}$/.test(value);
};

export const isUrl = (value) => {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
};

export const isStrongPassword = (value) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
};

export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

export const isNumeric = (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
};

export const minLength = (value, min) => {
    return value && value.length >= min;
};

export const maxLength = (value, max) => {
    return !value || value.length <= max;
};

export const inRange = (value, min, max) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
};
