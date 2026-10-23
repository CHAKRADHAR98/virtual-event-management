const eventModel = require('../models/eventModel');
const userModel = require('../models/userModel');
const emailService = require('../services/emailService');

const findEventOr404 = (req, next) => {
    const event = eventModel.findById(Number(req.params.id));
    if (!event) {
        next({ status: 404, message: `Event with id ${req.params.id} not found` });
    }
    return event;
};

const ensureOwner = (event, user, next) => {
    if (event.organizerId !== user.id) {
        next({ status: 403, message: 'Only the organizer who created this event can modify it' });
        return false;
    }
    return true;
};

const listEvents = (req, res) => {
    const events = eventModel.findAll().map(eventModel.toPublic);
    return res.status(200).json({ events });
};

const getEvent = (req, res, next) => {
    const event = findEventOr404(req, next);
    if (!event) return;
    return res.status(200).json({ event: eventModel.toPublic(event) });
};

const createEvent = (req, res) => {
    const { title, description, date, time } = req.body;
    const event = eventModel.create({ title, description, date, time, organizerId: req.user.id });
    return res.status(201).json({ message: 'Event created successfully', event: eventModel.toPublic(event) });
};

const updateEvent = (req, res, next) => {
    const event = findEventOr404(req, next);
    if (!event || !ensureOwner(event, req.user, next)) return;

    eventModel.update(event, req.body);
    return res.status(200).json({ message: 'Event updated successfully', event: eventModel.toPublic(event) });
};

const deleteEvent = (req, res, next) => {
    const event = findEventOr404(req, next);
    if (!event || !ensureOwner(event, req.user, next)) return;

    eventModel.remove(event.id);
    return res.status(200).json({ message: 'Event deleted successfully' });
};

const listParticipants = (req, res, next) => {
    const event = findEventOr404(req, next);
    if (!event || !ensureOwner(event, req.user, next)) return;

    const participants = event.participants
        .map((id) => userModel.findById(id))
        .filter(Boolean)
        .map(userModel.toPublic);

    return res.status(200).json({ eventId: event.id, participants });
};

const registerForEvent = async (req, res, next) => {
    try {
        const event = findEventOr404(req, next);
        if (!event) return;

        if (event.participants.includes(req.user.id)) {
            return next({ status: 409, message: 'You are already registered for this event' });
        }

        eventModel.addParticipant(event, req.user.id);
        const emailSent = await emailService.notify(emailService.sendEventRegistrationEmail, req.user, event);

        return res.status(201).json({
            message: 'Registered for event successfully',
            event: eventModel.toPublic(event),
            emailSent,
        });
    } catch (error) {
        return next(error);
    }
};

const cancelRegistration = (req, res, next) => {
    const event = findEventOr404(req, next);
    if (!event) return;

    if (!event.participants.includes(req.user.id)) {
        return next({ status: 404, message: 'You are not registered for this event' });
    }

    eventModel.removeParticipant(event, req.user.id);
    return res.status(200).json({ message: 'Registration cancelled successfully' });
};

const listMyRegistrations = (req, res) => {
    const events = eventModel.findByParticipant(req.user.id).map(eventModel.toPublic);
    return res.status(200).json({ events });
};

module.exports = {
    listEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    listParticipants,
    registerForEvent,
    cancelRegistration,
    listMyRegistrations,
};
