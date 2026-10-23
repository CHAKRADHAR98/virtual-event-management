const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const emailService = require('../services/emailService');
const { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } = require('../config');

const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (userModel.findByEmail(email)) {
            return next({ status: 409, message: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = userModel.create({ name, email, password: hashedPassword, role });
        const emailSent = await emailService.notify(emailService.sendWelcomeEmail, user);

        return res.status(201).json({
            message: 'User registered successfully',
            user: userModel.toPublic(user),
            emailSent,
        });
    } catch (error) {
        return next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = userModel.findByEmail(email);

        if (!user) {
            return next({ status: 401, message: 'Invalid email or password' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return next({ status: 401, message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(200).json({ token, user: userModel.toPublic(user) });
    } catch (error) {
        return next(error);
    }
};

module.exports = { register, login };
