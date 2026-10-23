const { isNonEmptyString } = require('./validateUser');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const isValidDate = (value) => {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
        return false;
    }
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};

const isValidTime = (value) => typeof value === 'string' && TIME_PATTERN.test(value);

const FIELD_CHECKS = {
    title: [isNonEmptyString, 'title must be a non-empty string'],
    description: [isNonEmptyString, 'description must be a non-empty string'],
    date: [isValidDate, 'date must be a valid date in YYYY-MM-DD format'],
    time: [isValidTime, 'time must be in 24-hour HH:MM format'],
};

const validateEvent = ({ partial }) => (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    const present = Object.keys(FIELD_CHECKS).filter((field) => body[field] !== undefined);

    Object.entries(FIELD_CHECKS).forEach(([field, [check, message]]) => {
        if (body[field] === undefined) {
            if (!partial) {
                errors.push(`${field} is required`);
            }
        } else if (!check(body[field])) {
            errors.push(message);
        }
    });

    if (partial && present.length === 0) {
        errors.push('provide at least one of: title, description, date, time');
    }

    if (errors.length > 0) {
        return next({ status: 400, message: 'Invalid event payload', details: errors });
    }

    return next();
};

module.exports = {
    validateCreateEvent: validateEvent({ partial: false }),
    validateUpdateEvent: validateEvent({ partial: true }),
};
