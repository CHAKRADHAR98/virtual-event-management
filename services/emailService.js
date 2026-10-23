const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = require('../config');

const usingSmtp = Boolean(SMTP_HOST);

const transporter = usingSmtp
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
    : nodemailer.createTransport({ jsonTransport: true });

const sendMail = async ({ to, subject, text }) => {
    const info = await transporter.sendMail({ from: MAIL_FROM, to, subject, text });

    if (!usingSmtp && process.env.NODE_ENV !== 'test') {
        console.log(`[email] to=${to} subject="${subject}"`);
    }

    return info;
};

const sendWelcomeEmail = (user) => sendMail({
    to: user.email,
    subject: 'Welcome to Virtual Events',
    text: `Hi ${user.name},\n\nYour ${user.role} account has been created successfully.\n\nVirtual Events`,
});

const sendEventRegistrationEmail = (user, event) => sendMail({
    to: user.email,
    subject: `You are registered for ${event.title}`,
    text: `Hi ${user.name},\n\nYou are registered for "${event.title}" on ${event.date} at ${event.time}.\n\n${event.description}\n\nVirtual Events`,
});

const notify = async (sendFn, ...args) => {
    try {
        await sendFn(...args);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error.message);
        return false;
    }
};

module.exports = { sendMail, sendWelcomeEmail, sendEventRegistrationEmail, notify };
