/**
 * DOM Utilities
 */

/**
 * Query selector shorthand
 */
export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

/**
 * Create element with attributes
 */
export const createElement = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([k, v]) => {
                el.dataset[k] = v;
            });
        } else {
            el.setAttribute(key, value);
        }
    });

    children.forEach((child) => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
            el.appendChild(child);
        }
    });

    return el;
};

/**
 * Add event listener with delegation
 */
export const on = (target, event, selector, handler) => {
    const element = typeof target === 'string' ? $(target) : target;

    if (typeof selector === 'function') {
        // No delegation
        element.addEventListener(event, selector);
    } else {
        // Event delegation
        element.addEventListener(event, (e) => {
            const match = e.target.closest(selector);
            if (match) {
                handler.call(match, e);
            }
        });
    }
};

/**
 * Initialize scroll-triggered animations
 */
export const initScrollAnimations = () => {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
        }
    );

    $$('[data-animate]').forEach((el) => observer.observe(el));
};

/**
 * Debounce function
 */
export const debounce = (fn, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Throttle function
 */
export const throttle = (fn, limit = 100) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

/**
 * Toggle class helper
 */
export const toggleClass = (el, className, force) => {
    const element = typeof el === 'string' ? $(el) : el;
    if (element) {
        element.classList.toggle(className, force);
    }
};

/**
 * Wait for DOM ready
 */
export const ready = (fn) => {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
};
