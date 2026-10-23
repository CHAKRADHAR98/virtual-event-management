const { ROLES } = require('../models/userModel');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const validateRegister = (req, res, next) => {
    const { name, email, password, role } = req.body || {};
    const errors = [];

    if (!isNonEmptyString(name)) {
        errors.push('name is required and must be a non-empty string');
    }

    if (!isNonEmptyString(email)) {
        errors.push('email is required and must be a non-empty string');
    } else if (!EMAIL_PATTERN.test(email.trim())) {
        errors.push('email must be a valid email address');
    }

    if (!isNonEmptyString(password)) {
        errors.push('password is required and must be a non-empty string');
    } else if (password.length < MIN_PASSWORD_LENGTH) {
        errors.push(`password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }

    if (role !== undefined && !ROLES.includes(role)) {
        errors.push(`role must be one of: ${ROLES.join(', ')}`);
    }

    if (errors.length > 0) {
        return next({ status: 400, message: 'Invalid registration payload', details: errors });
    }

    return next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body || {};
    const errors = [];

    if (!isNonEmptyString(email)) {
        errors.push('email is required');
    }

    if (!isNonEmptyString(password)) {
        errors.push('password is required');
    }

    if (errors.length > 0) {
        return next({ status: 400, message: 'Invalid login payload', details: errors });
    }

    return next();
};

module.exports = { validateRegister, validateLogin, isNonEmptyString };
