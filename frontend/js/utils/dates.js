/**
 * Date Utilities
 */

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const timeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
};

/**
 * Format date to readable string
 */
export const formatDate = (date, options = {}) => {
    const d = new Date(date);
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    };

    return d.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

/**
 * Format to short date (Mar 15)
 */
export const formatShortDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Get day and month for event cards
 */
export const getEventDateParts = (date) => {
    const d = new Date(date);
    return {
        day: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
};

/**
 * Check if date is past
 */
export const isPast = (date) => {
    return new Date(date) < new Date();
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
    const d = new Date(date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
};

/**
 * Check if date is within next N days
 */
export const isWithinDays = (date, days) => {
    const d = new Date(date);
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return d >= now && d <= future;
};
