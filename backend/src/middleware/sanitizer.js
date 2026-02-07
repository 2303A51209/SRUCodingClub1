const xss = require('xss-clean');

// Wrapper around xss-clean or custom sanitization
const sanitizer = () => {
    return xss();
};

module.exports = sanitizer;
